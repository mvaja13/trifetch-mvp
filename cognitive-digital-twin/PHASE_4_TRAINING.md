# Phase 4: Training Pipeline

## Goal
Train the fusion + forecast models on synthetic data.

## Deliverables
1. `src/train.py` - training loop with logging
2. `src/dataset.py` - PyTorch Dataset class for patient timelines
3. Trained model checkpoints in `checkpoints/`
4. Training plots (loss curves, MAE/RMSE)

## Tasks
- [ ] Implement dataset.py:
  - PyTorch Dataset that loads embeddings + timelines
  - Returns sequences of (audio_emb, stylus_emb, timestamp, score)
  - Train/test split (80/20)
- [ ] Implement train.py:
  - Load fusion + forecast models
  - Training loop with MSE loss
  - Log train/val loss, MAE, RMSE per epoch
  - Save best model checkpoint
  - Early stopping (patience=10)
- [ ] Train models:
  - 20 synthetic patients, 10-20 epochs
  - Run on CPU (or Colab GPU if available)
  - Save checkpoint to `checkpoints/best_model.pt`
- [ ] Generate training plots:
  - Loss curves (train/val)
  - MAE/RMSE over epochs
  - Predicted vs actual scatter plot for test set

## Technical Specs
- **Batch size**: 4-8 (small dataset)
- **Optimizer**: Adam, lr=1e-3
- **Epochs**: 10-20 (until convergence)
- **Early stopping**: patience=10 on validation MAE
- **Metrics**: MSE (loss), MAE, RMSE
- **Checkpoint**: Save model state_dict + optimizer state

## Success Criteria
- Training completes without errors
- Validation MAE < 5 points (synthetic data should be learnable)
- `checkpoints/best_model.pt` exists and is loadable
- Training plots show clear convergence
- Test set predictions correlate with true scores (R² > 0.7)
