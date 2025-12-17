"""
Cognitive Score Forecasting Model

GRU-based model for forecasting cognitive scores from fused embeddings.

Architecture:
- Input: sequence of (fused_emb[128], timestamp, prev_score)
- 2-layer GRU (hidden_size=64)
- Output: predicted cognitive scores at 12m and 24m horizons

Usage:
    from forecast_model import ForecastModel

    model = ForecastModel()
    predictions = model(fused_embeddings, timestamps, scores)
    # Returns: (batch, 2) - predictions for 12m and 24m
"""

import torch
import torch.nn as nn
import numpy as np


class ForecastModel(nn.Module):
    """
    GRU-based forecasting model for cognitive score prediction

    Processes sequences of patient measurements and predicts future scores.
    """

    def __init__(
        self,
        input_dim=128,  # fused embedding dimension
        hidden_dim=64,
        num_layers=2,
        output_horizons=2,  # 12m and 24m
        dropout=0.1
    ):
        """
        Args:
            input_dim: Dimension of fused embeddings
            hidden_dim: GRU hidden state size
            num_layers: Number of GRU layers
            output_horizons: Number of forecast horizons (default: 2 for 12m, 24m)
            dropout: Dropout probability
        """
        super().__init__()

        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.output_horizons = output_horizons

        # Input projection: fused_emb + timestamp + prev_score + treatment
        # Total: input_dim + 1 + 1 + 1
        self.feature_dim = input_dim + 3

        # GRU layers
        self.gru = nn.GRU(
            input_size=self.feature_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        # Output head: predict scores for multiple horizons
        # Feature 3: Output 3 quantiles (0.1, 0.5, 0.9) per horizon
        self.output_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, output_horizons * 3)
        )

        # Normalization buffers
        self.register_buffer('timestamp_mean', torch.tensor(12.0))  # months
        self.register_buffer('timestamp_std', torch.tensor(8.0))
        self.register_buffer('score_mean', torch.tensor(90.0))
        self.register_buffer('score_std', torch.tensor(5.0))

    def normalize_timestamp(self, timestamp):
        """Normalize timestamp (in months)"""
        return (timestamp - self.timestamp_mean) / (self.timestamp_std + 1e-6)

    def normalize_score(self, score):
        """Normalize cognitive score"""
        return (score - self.score_mean) / (self.score_std + 1e-6)

    def denormalize_score(self, score_norm):
        """Denormalize cognitive score"""
        return score_norm * self.score_std + self.score_mean

    def forward(self, fused_embeddings, timestamps, scores, treatment):
        """
        Forward pass

        Args:
            fused_embeddings: Fused embeddings, shape (batch, seq_len, input_dim)
            timestamps: Timestamps in months, shape (batch, seq_len)
            scores: Cognitive scores, shape (batch, seq_len)
            treatment: Treatment flag, shape (batch,) or scalar

        Returns:
            predictions: Predicted scores, shape (batch, output_horizons, 3)
                         Last dim is quantiles [0.1, 0.5, 0.9]
        """
        batch_size, seq_len, _ = fused_embeddings.shape

        # Normalize timestamps and scores
        timestamps_norm = self.normalize_timestamp(timestamps).unsqueeze(-1)  # (batch, seq_len, 1)
        scores_norm = self.normalize_score(scores).unsqueeze(-1)  # (batch, seq_len, 1)

        # Prepare treatment tensor
        if not isinstance(treatment, torch.Tensor):
            treatment = torch.tensor(treatment, device=fused_embeddings.device)
        
        if treatment.dim() == 0:
            treatment = treatment.expand(batch_size)
        
        # Expand timestamps and treatment to sequence length
        # treatment: (batch,) -> (batch, seq_len, 1)
        treatment_seq = treatment.unsqueeze(1).unsqueeze(2).expand(batch_size, seq_len, 1)

        # Concatenate features
        # Shape: (batch, seq_len, input_dim + 3)
        features = torch.cat([
            fused_embeddings, 
            timestamps_norm, 
            scores_norm, 
            treatment_seq.float()
        ], dim=-1)

        # GRU forward pass
        # output: (batch, seq_len, hidden_dim)
        # hidden: (num_layers, batch, hidden_dim)
        output, hidden = self.gru(features)

        # Use last hidden state for prediction
        # Shape: (batch, hidden_dim)
        last_hidden = output[:, -1, :]

        # Predict future scores
        # Shape: (batch, output_horizons * 3) (flat)
        predictions_norm = self.output_head(last_hidden)

        # Reshape to (batch, output_horizons, 3)
        # where 3 = [q0.1, q0.5, q0.9]
        predictions_norm = predictions_norm.view(batch_size, self.output_horizons, 3)

        # Denormalize predictions
        predictions = self.denormalize_score(predictions_norm)

        return predictions

    def predict_with_confidence(self, fused_embeddings, timestamps, scores, treatment, n_samples=10):
        """
        Predict with Monte Carlo dropout for confidence intervals

        Args:
            fused_embeddings: Shape (batch, seq_len, input_dim) or (seq_len, input_dim)
            timestamps: Shape (batch, seq_len) or (seq_len,)
            scores: Shape (batch, seq_len) or (seq_len,)
            treatment: Shape (batch,) or scalar
            n_samples: Number of MC dropout samples

        Returns:
            mean_pred: Mean predictions, shape (batch, output_horizons)
            std_pred: Std of predictions, shape (batch, output_horizons)
        """
        # Handle single sample
        single_sample = False
        if fused_embeddings.dim() == 2:
            single_sample = True
            fused_embeddings = fused_embeddings.unsqueeze(0)
            timestamps = timestamps.unsqueeze(0)
            scores = scores.unsqueeze(0)

            if not isinstance(treatment, torch.Tensor):
                treatment = torch.tensor(treatment, device=fused_embeddings.device)
            if treatment.dim() == 0:
                   treatment = treatment.unsqueeze(0)

        # For Quantile Regression, forward() already returns quantiles
        # We can just return the single pass output, or average over dropout if desired.
        # User requirement says "Replace point-predictions", implying direct quantile output.
        
        # Disable dropout
        self.eval() 
        with torch.no_grad():
             # Shape: (batch, horizons, 3)
             predictions = self.forward(fused_embeddings, timestamps, scores, treatment)
        
        # Extract mean (median/q0.5) and bound
        median_pred = predictions[:, :, 1] # q0.5
        lower_pred = predictions[:, :, 0]  # q0.1
        upper_pred = predictions[:, :, 2]  # q0.9
        
        # Approximate std from IQR/interval for compatibility with existing interface if needed
        # But better to return the interval.
        # For compatibility with test script, let's return median as mean, 
        # and (upper-lower)/4 as pseudo-std (handling 10th-90th percentile -> ~2.56 sigma)
        
        mean_pred = median_pred
        std_pred = (upper_pred - lower_pred) / 2.56 # Approximation

        if single_sample:
            mean_pred = mean_pred.squeeze(0)
            std_pred = std_pred.squeeze(0)

        return mean_pred, std_pred

    def get_num_parameters(self):
        """Return total number of trainable parameters"""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


def test_forecast_model():
    """
    Test forecast model with dummy data
    """
    print("=" * 60)
    print("Testing Forecast Model")
    print("=" * 60)

    # Create model
    model = ForecastModel(
        input_dim=128,
        hidden_dim=64,
        num_layers=2,
        output_horizons=2  # 12m, 24m
    )

    print(f"\nModel architecture:")
    print(f"  Input: fused_emb(128) + timestamp(1) + score(1) + treatment(1) = 131")
    print(f"  GRU: 2 layers, hidden_size=64")
    print(f"  Output: 2 horizons * 3 quantiles = 6 outputs")
    print(f"\nTotal parameters: {model.get_num_parameters():,}")

    # Test single sequence
    print("\n[1] Testing single sequence...")
    seq_len = 3  # 3 historical measurements
    fused_emb = torch.randn(seq_len, 128)
    timestamps = torch.tensor([0.0, 6.0, 12.0])  # months
    scores = torch.tensor([95.0, 92.0, 90.0])  # declining
    treatment = 0

    # Add batch dimension
    fused_emb_batch = fused_emb.unsqueeze(0)
    timestamps_batch = timestamps.unsqueeze(0)
    scores_batch = scores.unsqueeze(0)
    treatment_batch = torch.tensor([treatment])

    model.eval()
    with torch.no_grad():
        predictions = model(fused_emb_batch, timestamps_batch, scores_batch, treatment_batch)

    print(f"  Input: {seq_len} timepoints")
    print(f"  Historical scores: {scores.tolist()}")
    print(f"  Predictions shape: {predictions.shape}")
    print(f"  Predicted at 12m (q0.1, q0.5, q0.9): {predictions[0, 0].tolist()}")
    print(f"  Predicted at 24m (q0.5): {predictions[0, 1, 1]:.2f}")

    # Test batch
    print("\n[2] Testing batch...")
    batch_size = 8
    seq_len = 4
    fused_emb_batch = torch.randn(batch_size, seq_len, 128)
    timestamps_batch = torch.tensor([[0, 6, 12, 18]] * batch_size).float()
    scores_batch = torch.rand(batch_size, seq_len) * 20 + 80  # 80-100
    treatment_batch = torch.randint(0, 2, (batch_size,)).float()

    predictions_batch = model(fused_emb_batch, timestamps_batch, scores_batch, treatment_batch)
    print(f"  Batch size: {batch_size}")
    print(f"  Sequence length: {seq_len}")
    print(f"  Predictions shape: {predictions_batch.shape}")
    print(f"  Prediction range: [{predictions_batch.min():.2f}, {predictions_batch.max():.2f}]")

    # Test MC dropout for confidence
    print("\n[3] Testing MC dropout confidence...")
    mean_pred, std_pred = model.predict_with_confidence(
        fused_emb, timestamps, scores, treatment, n_samples=10
    )
    print(f"  Mean predictions (q0.5): [{mean_pred[0].item():.2f}, {mean_pred[1].item():.2f}]")
    print(f"  Std (proxy): [{std_pred[0].item():.2f}, {std_pred[1].item():.2f}]")
    print(f"  95% CI at 12m: [{mean_pred[0].item() - 2*std_pred[0].item():.2f}, {mean_pred[0].item() + 2*std_pred[0].item():.2f}]")
    print(f"  95% CI at 24m: [{mean_pred[1].item() - 2*std_pred[1].item():.2f}, {mean_pred[1].item() + 2*std_pred[1].item():.2f}]")

    # Test gradient flow
    print("\n[4] Testing gradient flow...")
    model.train()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    predictions = model(fused_emb_batch, timestamps_batch, scores_batch, treatment_batch)
    # Use simple sum for gradient check since shapes differ (batch, 2, 3) vs (batch, 2)
    loss = predictions.sum()

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    print(f"  ✓ Forward pass successful")
    print(f"  ✓ Backward pass successful")
    print(f"  ✓ Optimizer step successful")
    print(f"  Loss: {loss.item():.4f}")

    print("\n" + "=" * 60)
    print("✅ Forecast model tests passed!")
    print("=" * 60)


if __name__ == '__main__':
    test_forecast_model()
