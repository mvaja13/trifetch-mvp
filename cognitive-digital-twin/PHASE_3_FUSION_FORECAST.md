# Phase 3: Fusion & Forecasting Models

## Goal
Build tiny models to fuse embeddings and forecast cognitive scores.

## Deliverables
1. `src/fusion_model.py` - multimodal fusion model (Perceiver-lite or transformer)
2. `src/forecast_model.py` - GRU-based forecasting head
3. Model architecture diagrams (text/comments in code)

## Tasks
- [ ] Implement fusion_model.py:
  - Concat audio_emb (128) + stylus_emb (128) + scalar features (age, baseline_score) → 258-d
  - 2-layer transformer encoder (hidden dim 128, 2 heads)
  - Output: 128-d fused embedding
  - Keep params < 500K
- [ ] Implement forecast_model.py:
  - GRU that takes sequence of fused vectors + timestamps
  - Output: predicted cognitive score for 12m & 24m horizons
  - Support irregular time series (optional: GRU-D)
  - Keep params < 500K
- [ ] Add forward pass tests with dummy data
- [ ] Document model architectures in docstrings

## Technical Specs
- **Fusion**: 2-layer transformer encoder, 128 hidden, 2 attention heads
- **Forecast**: 2-layer GRU, hidden size 64, output FC layer to scalar
- **Input**: sequence of (fused_emb, timestamp, cognitive_score) tuples
- **Output**: predicted scores at 12m and 24m
- **Total params**: < 1M combined
- **Loss**: MSE on cognitive score predictions

## Success Criteria
- fusion_model.py defines `FusionModel` class with forward()
- forecast_model.py defines `ForecastModel` class with forward()
- Models can be instantiated and run forward pass on dummy data
- Total parameters < 1M (check with sum(p.numel() for p in model.parameters()))
- Code includes clear comments on input/output shapes
