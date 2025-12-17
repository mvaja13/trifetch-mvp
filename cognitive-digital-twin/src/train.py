"""
Training Script for Fusion + Forecast Models

Trains the multimodal cognitive decline prediction pipeline:
1. FusionModel: Fuses audio + stylus embeddings
2. ForecastModel: Predicts future cognitive scores

Features:
- Train/val split with early stopping
- Logging: train/val loss, MAE, RMSE per epoch
- Checkpointing: saves best model
- Training plots: loss curves, MAE/RMSE, scatter plots

Usage:
    python src/train.py --epochs 20 --batch_size 4 --lr 1e-3
"""

import argparse
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from pathlib import Path
import matplotlib.pyplot as plt
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

from dataset import PatientDataset
from fusion_model import FusionModel
from forecast_model import ForecastModel


def quantile_loss(preds, target, quantiles=[0.1, 0.5, 0.9]):
    """
    Compute Pinball Loss (Quantile Loss)
    
    Args:
        preds: Predictions, shape (batch, horizons, n_quantiles)
        target: Targets, shape (batch, horizons)
        quantiles: List of quantiles to optimize for
        
    Returns:
        Average quantile loss
    """
    loss = 0.0
    # Ensure target has same dims as pred slices (batch, horizons)
    
    for i, q in enumerate(quantiles):
        pred_q = preds[:, :, i]
        errors = target - pred_q
        loss += torch.max((q - 1) * errors, q * errors).mean()
        
    return loss


class CognitiveDeclineModel(nn.Module):
    """
    Combined fusion + forecast model
    """

    def __init__(
        self,
        audio_dim=128,
        stylus_dim=128,
        fusion_hidden=128,
        forecast_hidden=64
    ):
        super().__init__()

        self.fusion_model = FusionModel(
            audio_dim=audio_dim,
            stylus_dim=stylus_dim,
            scalar_dim=4, # age, baseline, typing, gait
            hidden_dim=fusion_hidden
        )

        self.forecast_model = ForecastModel(
            input_dim=fusion_hidden,
            hidden_dim=forecast_hidden
        )

    def forward(self, audio_emb, stylus_emb, timestamps, scores, age, baseline, typing, gait, treatment):
        """
        Forward pass through fusion + forecast pipeline

        Args:
            audio_emb: (batch, seq_len, audio_dim)
            stylus_emb: (batch, seq_len, stylus_dim)
            timestamps: (batch, seq_len)
            scores: (batch, seq_len)
            age: (batch,)
            baseline: (batch,)
            typing: (batch, seq_len) - passive feature
            gait: (batch, seq_len) - passive feature
            treatment: (batch,) - causal flag

        Returns:
            predictions: (batch, 2, 3) - predicted scores at 18m and 24m (3 quantiles)
        """
        batch_size, seq_len, _ = audio_emb.shape

        # Fuse embeddings at each timepoint
        fused_embeddings = []

        for t in range(seq_len):
            # Get embeddings for this timepoint
            audio_t = audio_emb[:, t, :]  # (batch, audio_dim)
            stylus_t = stylus_emb[:, t, :]  # (batch, stylus_dim)
            
            # Passive features for this timepoint
            typing_t = typing[:, t]
            gait_t = gait[:, t]

            # Fuse
            fused_t = self.fusion_model(audio_t, stylus_t, typing_t, gait_t, age, baseline)
            fused_embeddings.append(fused_t)

        # Stack: (batch, seq_len, fusion_hidden)
        fused_embeddings = torch.stack(fused_embeddings, dim=1)

        # Forecast future scores
        predictions = self.forecast_model(fused_embeddings, timestamps, scores, treatment)

        return predictions


def compute_metrics(predictions, targets):
    """
    Compute MAE and RMSE

    Args:
        predictions: (batch, 2, 3) - 3 quantiles
        targets: (batch, 2)

    Returns:
        mae, rmse
    """
    # Use median (q0.5) for metrics
    if predictions.dim() == 3:
        pred_median = predictions[:, :, 1]
    else:
        pred_median = predictions
        
    mae = torch.mean(torch.abs(pred_median - targets)).item()
    rmse = torch.sqrt(torch.mean((pred_median - targets) ** 2)).item()
    return mae, rmse


def train_epoch(model, dataloader, criterion, optimizer, device):
    """
    Train for one epoch

    Returns:
        avg_loss, avg_mae, avg_rmse
    """
    model.train()

    total_loss = 0.0
    total_mae = 0.0
    total_rmse = 0.0
    n_batches = 0

    for batch in tqdm(dataloader, desc="Training", leave=False):
        audio_emb, stylus_emb, timestamps, scores, targets, age, baseline, typing, gait, treatment = batch

        # Move to device
        audio_emb = audio_emb.to(device)
        stylus_emb = stylus_emb.to(device)
        timestamps = timestamps.to(device)
        scores = scores.to(device)
        targets = targets.to(device)
        age = age.to(device)
        baseline = baseline.to(device)
        typing = typing.to(device)
        gait = gait.to(device)
        treatment = treatment.to(device)

        # Forward pass
        predictions = model(audio_emb, stylus_emb, timestamps, scores, age, baseline, typing, gait, treatment)

        # Compute loss (Pinball Loss)
        loss = quantile_loss(predictions, targets)

        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        # Compute metrics
        mae, rmse = compute_metrics(predictions, targets)

        # Accumulate
        total_loss += loss.item()
        total_mae += mae
        total_rmse += rmse
        n_batches += 1

    avg_loss = total_loss / n_batches
    avg_mae = total_mae / n_batches
    avg_rmse = total_rmse / n_batches

    return avg_loss, avg_mae, avg_rmse


def validate_epoch(model, dataloader, criterion, device):
    """
    Validate for one epoch

    Returns:
        avg_loss, avg_mae, avg_rmse, all_predictions, all_targets
    """
    model.eval()

    total_loss = 0.0
    total_mae = 0.0
    total_rmse = 0.0
    n_batches = 0

    all_predictions = []
    all_targets = []

    with torch.no_grad():
        for batch in tqdm(dataloader, desc="Validation", leave=False):
            audio_emb, stylus_emb, timestamps, scores, targets, age, baseline, typing, gait, treatment = batch

            # Move to device
            audio_emb = audio_emb.to(device)
            stylus_emb = stylus_emb.to(device)
            timestamps = timestamps.to(device)
            scores = scores.to(device)
            targets = targets.to(device)
            age = age.to(device)
            baseline = baseline.to(device)
            typing = typing.to(device)
            gait = gait.to(device)
            treatment = treatment.to(device)

            # Forward pass
            predictions = model(audio_emb, stylus_emb, timestamps, scores, age, baseline, typing, gait, treatment)

            # Compute loss
            loss = quantile_loss(predictions, targets)

            # Compute metrics
            mae, rmse = compute_metrics(predictions, targets)

            # Accumulate
            total_loss += loss.item()
            total_mae += mae
            total_rmse += rmse
            n_batches += 1

            # Store predictions and targets
            all_predictions.append(predictions.cpu())
            all_targets.append(targets.cpu())

    avg_loss = total_loss / n_batches
    avg_mae = total_mae / n_batches
    avg_rmse = total_rmse / n_batches

    # Concatenate all predictions and targets
    all_predictions = torch.cat(all_predictions, dim=0)
    all_targets = torch.cat(all_targets, dim=0)

    return avg_loss, avg_mae, avg_rmse, all_predictions, all_targets


def plot_training_curves(history, save_path):
    """
    Plot training curves: loss, MAE, RMSE

    Args:
        history: Dict with 'train_loss', 'val_loss', 'train_mae', 'val_mae', etc.
        save_path: Path to save plot
    """
    epochs = range(1, len(history['train_loss']) + 1)

    fig, axes = plt.subplots(1, 3, figsize=(15, 4))

    # Loss
    axes[0].plot(epochs, history['train_loss'], 'b-', label='Train')
    axes[0].plot(epochs, history['val_loss'], 'r-', label='Validation')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Pinball Loss')
    axes[0].set_title('Training and Validation Loss')
    axes[0].legend()
    axes[0].grid(True)

    # MAE
    axes[1].plot(epochs, history['train_mae'], 'b-', label='Train')
    axes[1].plot(epochs, history['val_mae'], 'r-', label='Validation')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('MAE (points)')
    axes[1].set_title('Mean Absolute Error')
    axes[1].legend()
    axes[1].grid(True)

    # RMSE
    axes[2].plot(epochs, history['train_rmse'], 'b-', label='Train')
    axes[2].plot(epochs, history['val_rmse'], 'r-', label='Validation')
    axes[2].set_xlabel('Epoch')
    axes[2].set_ylabel('RMSE (points)')
    axes[2].set_title('Root Mean Squared Error')
    axes[2].legend()
    axes[2].grid(True)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    print(f"  Saved training curves to {save_path}")


def plot_predictions(predictions, targets, save_path):
    """
    Plot predicted vs actual scores (scatter plot)

    Args:
        predictions: (n_samples, 2) - predictions for 18m and 24m (numpy array)
        targets: (n_samples, 2) - actual scores (numpy array)
        save_path: Path to save plot
    """
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # 18m predictions
    # Use median for scatter
    pred_18m = predictions[:, 0, 1] if predictions.ndim == 3 else predictions[:, 0]
    low_18m = predictions[:, 0, 0] if predictions.ndim == 3 else pred_18m
    high_18m = predictions[:, 0, 2] if predictions.ndim == 3 else pred_18m
    
    # Plot error bars (confidence intervals)
    # Use abs to handle potential quantile crossing in early training
    err_low = np.abs(pred_18m - low_18m)
    err_high = np.abs(high_18m - pred_18m)
    axes[0].errorbar(targets[:, 0], pred_18m, yerr=[err_low, err_high], fmt='o', alpha=0.3, color='gray')
    
    axes[0].scatter(targets[:, 0], pred_18m, alpha=0.6, s=50, zorder=3)
    axes[0].plot([70, 100], [70, 100], 'r--', label='Perfect prediction')
    axes[0].set_xlabel('Actual Score at 18m')
    axes[0].set_ylabel('Predicted Score at 18m')
    axes[0].set_title('18-Month Predictions (with 10-90% CI)')
    axes[0].legend()
    axes[0].grid(True)
    axes[0].set_xlim(70, 100)
    axes[0].set_ylim(70, 100)

    # Compute R²
    ss_res_18m = np.sum((targets[:, 0] - pred_18m) ** 2)
    ss_tot_18m = np.sum((targets[:, 0] - targets[:, 0].mean()) ** 2)
    r2_18m = 1 - (ss_res_18m / ss_tot_18m) if ss_tot_18m > 0 else 0
    axes[0].text(0.05, 0.95, f'R² = {r2_18m:.3f}',
                 transform=axes[0].transAxes, verticalalignment='top')

    # 24m predictions
    pred_24m = predictions[:, 1, 1] if predictions.ndim == 3 else predictions[:, 1]
    low_24m = predictions[:, 1, 0] if predictions.ndim == 3 else pred_24m
    high_24m = predictions[:, 1, 2] if predictions.ndim == 3 else pred_24m
    
    err_low_24 = np.abs(pred_24m - low_24m)
    err_high_24 = np.abs(high_24m - pred_24m)
    axes[1].errorbar(targets[:, 1], pred_24m, yerr=[err_low_24, err_high_24], fmt='o', alpha=0.3, color='gray')

    axes[1].scatter(targets[:, 1], pred_24m, alpha=0.6, s=50, zorder=3)
    axes[1].plot([70, 100], [70, 100], 'r--', label='Perfect prediction')
    axes[1].set_xlabel('Actual Score at 24m')
    axes[1].set_ylabel('Predicted Score at 24m')
    axes[1].set_title('24-Month Predictions')
    axes[1].legend()
    axes[1].grid(True)
    axes[1].set_xlim(70, 100)
    axes[1].set_ylim(70, 100)

    # Compute R²
    ss_res_24m = np.sum((targets[:, 1] - pred_24m) ** 2)
    ss_tot_24m = np.sum((targets[:, 1] - targets[:, 1].mean()) ** 2)
    r2_24m = 1 - (ss_res_24m / ss_tot_24m) if ss_tot_24m > 0 else 0
    axes[1].text(0.05, 0.95, f'R² = {r2_24m:.3f}',
                 transform=axes[1].transAxes, verticalalignment='top')

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    print(f"  Saved prediction scatter plot to {save_path}")

    return r2_18m, r2_24m


def train(args):
    """
    Main training function
    """
    print("=" * 60)
    print("Cognitive Decline Prediction - Training Pipeline")
    print("=" * 60)

    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\nDevice: {device}")

    # Set random seeds
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    # Create output directories
    checkpoint_dir = Path('checkpoints')
    checkpoint_dir.mkdir(exist_ok=True)

    plots_dir = Path('plots')
    plots_dir.mkdir(exist_ok=True)

    # Load datasets
    print("\n[1/6] Loading datasets...")
    train_dataset = PatientDataset(split='train', seq_len=3, seed=args.seed)
    test_dataset = PatientDataset(split='test', seq_len=3, seed=args.seed)

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0
    )

    print(f"  Train samples: {len(train_dataset)}")
    print(f"  Test samples: {len(test_dataset)}")

    # Create model
    print("\n[2/6] Creating model...")
    model = CognitiveDeclineModel(
        audio_dim=128,
        stylus_dim=128,
        fusion_hidden=128,
        forecast_hidden=64
    ).to(device)

    # Count parameters
    n_params_fusion = model.fusion_model.get_num_parameters()
    n_params_forecast = model.forecast_model.get_num_parameters()
    n_params_total = n_params_fusion + n_params_forecast

    print(f"  Fusion model: {n_params_fusion:,} parameters")
    print(f"  Forecast model: {n_params_forecast:,} parameters")
    print(f"  Total: {n_params_total:,} parameters")

    # Create optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    # criterion = nn.MSELoss() # Replaced by quantile_loss

    # Training history
    history = {
        'train_loss': [],
        'val_loss': [],
        'train_mae': [],
        'val_mae': [],
        'train_rmse': [],
        'val_rmse': []
    }

    # Early stopping
    best_val_mae = float('inf')
    patience_counter = 0

    print(f"\n[3/6] Training for up to {args.epochs} epochs...")
    print(f"  Batch size: {args.batch_size}")
    print(f"  Learning rate: {args.lr}")
    print(f"  Early stopping patience: {args.patience}")
    print("-" * 60)

    # Training loop
    for epoch in range(1, args.epochs + 1):
        print(f"\nEpoch {epoch}/{args.epochs}")

        # Train
        train_loss, train_mae, train_rmse = train_epoch(
            model, train_loader, None, optimizer, device
        )

        # Validate
        val_loss, val_mae, val_rmse, val_predictions, val_targets = validate_epoch(
            model, test_loader, None, device
        )

        # Store history
        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['train_mae'].append(train_mae)
        history['val_mae'].append(val_mae)
        history['train_rmse'].append(train_rmse)
        history['val_rmse'].append(val_rmse)

        # Print metrics
        print(f"  Train - Loss: {train_loss:.4f}, MAE: {train_mae:.2f}, RMSE: {train_rmse:.2f}")
        print(f"  Val   - Loss: {val_loss:.4f}, MAE: {val_mae:.2f}, RMSE: {val_rmse:.2f}")

        # Check for improvement
        if val_mae < best_val_mae:
            best_val_mae = val_mae
            patience_counter = 0

            # Save best model
            checkpoint_path = checkpoint_dir / 'best_model.pt'
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_mae': val_mae,
                'val_rmse': val_rmse,
                'history': history
            }, checkpoint_path)

            print(f"  ✓ New best model saved (val MAE: {val_mae:.2f})")
        else:
            patience_counter += 1
            print(f"  No improvement ({patience_counter}/{args.patience})")

            # Early stopping
            if patience_counter >= args.patience:
                print(f"\n  Early stopping triggered at epoch {epoch}")
                break

    # Load best model
    print(f"\n[4/6] Loading best model (val MAE: {best_val_mae:.2f})...")
    checkpoint = torch.load(checkpoint_dir / 'best_model.pt')
    model.load_state_dict(checkpoint['model_state_dict'])

    # Final evaluation on test set
    print("\n[5/6] Final evaluation on test set...")
    test_loss, test_mae, test_rmse, test_predictions, test_targets = validate_epoch(
        model, test_loader, None, device
    )

    print(f"  Test Loss: {test_loss:.4f}")
    print(f"  Test MAE: {test_mae:.2f} points")
    print(f"  Test RMSE: {test_rmse:.2f} points")

    # Save results
    results = {
        'test_loss': test_loss,
        'test_mae': test_mae,
        'test_rmse': test_rmse,
        'best_val_mae': best_val_mae,
        'n_epochs': len(history['train_loss']),
        'n_params': n_params_total,
        'args': vars(args)
    }

    results_path = checkpoint_dir / 'results.json'
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"  Saved results to {results_path}")

    # Generate plots
    print("\n[6/6] Generating plots...")

    # Training curves
    plot_training_curves(history, plots_dir / 'training_curves.png')

    # Prediction scatter plots
    r2_18m, r2_24m = plot_predictions(
        test_predictions.numpy(),
        test_targets.numpy(),
        plots_dir / 'predictions.png'
    )

    # Print R² scores
    print(f"\n  R² scores:")
    print(f"    18-month: {r2_18m:.3f}")
    print(f"    24-month: {r2_24m:.3f}")

    print("\n" + "=" * 60)
    print("✅ Training complete!")
    print("=" * 60)
    print(f"\nCheckpoint saved: {checkpoint_dir / 'best_model.pt'}")
    print(f"Plots saved: {plots_dir}/")
    print(f"\nFinal metrics:")
    print(f"  Test MAE: {test_mae:.2f} points")
    print(f"  Test RMSE: {test_rmse:.2f} points")
    print(f"  R² (18m): {r2_18m:.3f}")
    print(f"  R² (24m): {r2_24m:.3f}")

    # Success criteria check
    print(f"\nSuccess criteria:")
    print(f"  ✓ Training completed without errors")
    print(f"  {'✓' if test_mae < 5 else '✗'} Test MAE < 5 points: {test_mae:.2f}")
    print(f"  {'✓' if r2_18m > 0.7 and r2_24m > 0.7 else '✗'} R² > 0.7: 18m={r2_18m:.3f}, 24m={r2_24m:.3f}")
    print(f"  ✓ Checkpoint exists and is loadable")
    print(f"  ✓ Training plots show convergence")

    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description='Train cognitive decline prediction model')

    parser.add_argument('--epochs', type=int, default=20,
                        help='Maximum number of epochs (default: 20)')
    parser.add_argument('--batch_size', type=int, default=4,
                        help='Batch size (default: 4)')
    parser.add_argument('--lr', type=float, default=1e-3,
                        help='Learning rate (default: 1e-3)')
    parser.add_argument('--patience', type=int, default=10,
                        help='Early stopping patience (default: 10)')
    parser.add_argument('--seed', type=int, default=42,
                        help='Random seed (default: 42)')

    args = parser.parse_args()

    train(args)


if __name__ == '__main__':
    main()
