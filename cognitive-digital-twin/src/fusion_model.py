"""
Multimodal Fusion Model

Fuses audio and stylus embeddings using a lightweight transformer encoder.

Architecture:
- Input: concat(audio_emb[128], stylus_emb[128], scalar_features[2]) → 258-d
- 2-layer transformer encoder (hidden=128, heads=2)
- Output: 128-d fused embedding

Usage:
    from fusion_model import FusionModel

    model = FusionModel()
    fused = model(audio_emb, stylus_emb, age, baseline_score)
    # Returns: (batch, 128) or (128,) fused embedding
"""

import torch
import torch.nn as nn
import math


class PositionalEncoding(nn.Module):
    """
    Positional encoding for transformer
    (Optional - mainly useful for sequences, but included for completeness)
    """

    def __init__(self, d_model, max_len=100):
        super().__init__()

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)

        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        """
        Args:
            x: Tensor of shape (batch, seq_len, d_model)
        """
        return x + self.pe[:, :x.size(1), :]


class FusionModel(nn.Module):
    """
    Multimodal fusion model using transformer encoder

    Combines audio embeddings, stylus embeddings, and scalar features
    into a unified representation for forecasting.
    """

    def __init__(
        self,
        audio_dim=128,
        stylus_dim=128,
        scalar_dim=4,  # age, baseline_score, typing, gait
        hidden_dim=128,
        num_heads=2,
        num_layers=2,
        dropout=0.1
    ):
        """
        Args:
            audio_dim: Dimension of audio embeddings
            stylus_dim: Dimension of stylus embeddings
            scalar_dim: Number of scalar features
            hidden_dim: Hidden dimension for transformer
            num_heads: Number of attention heads
            num_layers: Number of transformer layers
            dropout: Dropout probability
        """
        super().__init__()

        self.audio_dim = audio_dim
        self.stylus_dim = stylus_dim
        self.scalar_dim = scalar_dim
        self.hidden_dim = hidden_dim

        # Input projection: concatenate all features
        input_dim = audio_dim + stylus_dim + scalar_dim

        # Project to hidden dimension
        self.input_projection = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout)
        )

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=num_heads,
            dim_feedforward=hidden_dim * 2,  # 256
            dropout=dropout,
            activation='relu',
            batch_first=True  # (batch, seq, feature) format
        )

        self.transformer_encoder = nn.TransformerEncoder(
            encoder_layer,
            num_layers=num_layers
        )

        # Output projection
        self.output_projection = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim),
        )

        # Normalization buffers for scalar features
        # Default values based on synthetic data stats
        # [age, baseline, typing, gait]
        self.register_buffer('scalar_mean', torch.tensor([75.0, 95.0, 132.0, 0.066]))
        self.register_buffer('scalar_std', torch.tensor([10.0, 5.0, 7.0, 0.009]))

    def normalize_scalars(self, scalars):
        """
        Normalize scalar features

        Args:
            scalars: Tensor of shape (batch, scalar_dim) or (scalar_dim,)

        Returns:
            Normalized scalars
        """
        return (scalars - self.scalar_mean) / (self.scalar_std + 1e-6)

    def forward(self, audio_emb, stylus_emb, typing, gait, age=None, baseline_score=None, scalars=None):
        """
        Forward pass

        Args:
            audio_emb: Audio embeddings, shape (batch, audio_dim) or (audio_dim,)
            stylus_emb: Stylus embeddings, shape (batch, stylus_dim) or (stylus_dim,)
            typing: Typing flight time, shape (batch,) or scalar
            gait: Gait variability, shape (batch,) or scalar
            age: Age values, shape (batch,) or scalar (optional if scalars provided)
            baseline_score: Baseline cognitive scores, shape (batch,) or scalar (optional if scalars provided)
            scalars: Combined scalar features, shape (batch, scalar_dim) or (scalar_dim,) (optional)

        Returns:
            fused_emb: Fused embeddings, shape (batch, hidden_dim) or (hidden_dim,)
        """
        # Handle single sample vs batch
        single_sample = False
        if audio_emb.dim() == 1:
            single_sample = True
            audio_emb = audio_emb.unsqueeze(0)
            stylus_emb = stylus_emb.unsqueeze(0)
            if not isinstance(typing, torch.Tensor) or typing.dim() == 0:
                typing = torch.tensor([typing], device=audio_emb.device)
            if not isinstance(gait, torch.Tensor) or gait.dim() == 0:
                gait = torch.tensor([gait], device=audio_emb.device)
            
            if scalars is not None:
                if scalars.dim() == 1:
                    scalars = scalars.unsqueeze(0)

        batch_size = audio_emb.shape[0]

        # Prepare scalar features
        if scalars is None:
            if age is None or baseline_score is None:
                # Use default values
                scalars = torch.zeros(batch_size, self.scalar_dim, device=audio_emb.device)
                scalars[:, 0] = 75.0  # default age
                scalars[:, 1] = 95.0  # default baseline
            else:
                # Stack age and baseline_score
                if not isinstance(age, torch.Tensor):
                    age = torch.tensor([age], device=audio_emb.device)
                if not isinstance(baseline_score, torch.Tensor):
                    baseline_score = torch.tensor([baseline_score], device=audio_emb.device)

                if age.dim() == 0:
                    age = age.unsqueeze(0)
                if baseline_score.dim() == 0:
                    baseline_score = baseline_score.unsqueeze(0)

                # Expand to batch size if needed
                if age.shape[0] == 1 and batch_size > 1:
                    age = age.expand(batch_size)
                if baseline_score.shape[0] == 1 and batch_size > 1:
                    baseline_score = baseline_score.expand(batch_size)

                scalars = torch.stack([age, baseline_score], dim=1)

                # Add passive biomarkers
                # Ensure they are tensors and correct shape
                if not isinstance(typing, torch.Tensor):
                    typing = torch.tensor(typing, device=audio_emb.device)
                if not isinstance(gait, torch.Tensor):
                    gait = torch.tensor(gait, device=audio_emb.device)
                
                if typing.dim() == 0: typing = typing.expand(batch_size)
                if gait.dim() == 0: gait = gait.expand(batch_size)
                
                # Stack all 4 scalars: [age, baseline, typing, gait]
                # Note: scalars above only had 2. We need to concat or re-stack.
                scalars = torch.stack([age, baseline_score, typing, gait], dim=1)

        # Normalize scalars
        scalars_norm = self.normalize_scalars(scalars)

        # Concatenate all features
        # Shape: (batch, audio_dim + stylus_dim + scalar_dim)
        combined = torch.cat([audio_emb, stylus_emb, scalars_norm], dim=1)

        # Project to hidden dimension
        # Shape: (batch, hidden_dim)
        hidden = self.input_projection(combined)

        # Add sequence dimension for transformer
        # Shape: (batch, 1, hidden_dim)
        hidden = hidden.unsqueeze(1)

        # Transformer encoding
        # Shape: (batch, 1, hidden_dim)
        encoded = self.transformer_encoder(hidden)

        # Remove sequence dimension
        # Shape: (batch, hidden_dim)
        encoded = encoded.squeeze(1)

        # Output projection
        # Shape: (batch, hidden_dim)
        fused_emb = self.output_projection(encoded)

        # Return to single sample if needed
        if single_sample:
            fused_emb = fused_emb.squeeze(0)

        return fused_emb

    def get_num_parameters(self):
        """Return total number of trainable parameters"""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


def test_fusion_model():
    """
    Test fusion model with dummy data
    """
    print("=" * 60)
    print("Testing Fusion Model")
    print("=" * 60)

    # Create model
    model = FusionModel(
        audio_dim=128,
        stylus_dim=128,
        hidden_dim=128,
        num_heads=2,
        num_layers=2
    )

    print(f"\nModel architecture:")
    print(f"  Input: audio(128) + stylus(128) + scalars(4) = 260")
    print(f"  Hidden: 128")
    print(f"  Transformer: 2 layers, 2 heads")
    print(f"  Output: 128")
    print(f"\nTotal parameters: {model.get_num_parameters():,}")

    # Test single sample
    print("\n[1] Testing single sample...")
    audio_emb = torch.randn(128)
    stylus_emb = torch.randn(128)
    age = 72.0
    baseline = 94.5
    typing = 130.0
    gait = 0.07

    fused = model(audio_emb, stylus_emb, typing, gait, age, baseline)
    print(f"  Input shapes: audio={audio_emb.shape}, stylus={stylus_emb.shape}")
    print(f"  Output shape: {fused.shape}")
    print(f"  Output range: [{fused.min():.3f}, {fused.max():.3f}]")

    # Test batch
    print("\n[2] Testing batch...")
    batch_size = 8
    audio_emb_batch = torch.randn(batch_size, 128)
    stylus_emb_batch = torch.randn(batch_size, 128)
    ages = torch.randint(65, 85, (batch_size,)).float()
    baselines = torch.rand(batch_size) * 10 + 90  # 90-100
    typings = torch.rand(batch_size) * 50 + 100
    gaits = torch.rand(batch_size) * 0.1 + 0.05

    fused_batch = model(audio_emb_batch, stylus_emb_batch, typings, gaits, ages, baselines)
    print(f"  Input shapes: audio={audio_emb_batch.shape}, stylus={stylus_emb_batch.shape}")
    print(f"  Output shape: {fused_batch.shape}")
    print(f"  Output range: [{fused_batch.min():.3f}, {fused_batch.max():.3f}]")

    # Test forward + backward
    print("\n[3] Testing gradient flow...")
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    fused = model(audio_emb_batch, stylus_emb_batch, typings, gaits, ages, baselines)
    loss = fused.mean()  # dummy loss

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    print(f"  ✓ Forward pass successful")
    print(f"  ✓ Backward pass successful")
    print(f"  ✓ Optimizer step successful")

    print("\n" + "=" * 60)
    print("✅ Fusion model tests passed!")
    print("=" * 60)


if __name__ == '__main__':
    test_fusion_model()
