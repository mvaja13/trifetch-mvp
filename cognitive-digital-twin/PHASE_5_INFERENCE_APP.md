# Phase 5: Inference & Streamlit App

## Goal
Build inference pipeline and interactive demo app.

## Deliverables
1. `src/infer.py` - inference script for single patient
2. `src/app.py` - Streamlit app with visualization
3. Working demo showing prediction curve + what-if scenarios

## Tasks
- [ ] Implement infer.py:
  - Load trained models from checkpoint
  - Given patient_id, load embeddings for all timepoints
  - Run fusion → forecast
  - Output predicted cognitive scores at 12m & 24m
  - Add confidence bands (MC-dropout or Gaussian noise)
  - Save predictions to CSV
- [ ] Implement app.py (Streamlit):
  - Patient selector dropdown
  - Plot historical cognitive scores (dots)
  - Plot predicted 24-month curve (line with shaded CI)
  - "What-if" sliders:
    - Sleep hours (+/- 2 hours)
    - Physical activity (+/- 20%)
  - Re-run forecast with adjusted parameters
  - Show before/after curves
- [ ] Test inference on 3-5 patients
- [ ] Polish UI with titles, labels, colors

## Technical Specs
- **Confidence bands**: MC-dropout (10 samples) or add σ=2 Gaussian noise
- **What-if logic**: Multiply decline rate by factor (e.g., +1hr sleep → 0.9x decline)
- **Streamlit components**: selectbox, slider, line_chart, pyplot
- **Interactivity**: Sliders trigger re-run of forecast

## Success Criteria
- `python src/infer.py --patient_id P001` produces predictions
- `streamlit run src/app.py` launches without errors
- App displays patient curves with clear legend
- What-if sliders visibly change the predicted curve
- UI is clean and intuitive (suitable for demo video)
