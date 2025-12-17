# Phase 1: Data Generation & Setup

## Goal
Set up project structure and generate synthetic data for training/testing.

## Deliverables
1. Project folder structure
2. `requirements.txt` with all dependencies
3. `src/data_gen.py` - synthetic patient data generator
4. Sample synthetic data in `data/synthetic/`
5. Sample audio files in `data/sample_audio/`

## Tasks
- [ ] Create folder structure (data/, src/, notebooks/, demo_assets/, checkpoints/)
- [ ] Write requirements.txt
- [ ] Implement data_gen.py to create:
  - 20 synthetic patients with cognitive score timelines (0, 6, 12, 18, 24 months)
  - Stylus traces (x, y, t, pressure) with varying hesitation/speed
  - Output: `patients.json` and `timelines.csv`
- [ ] Generate or copy 5 short WAV files (6-20s) to `data/sample_audio/`
- [ ] Test: Run `python src/data_gen.py` and verify outputs

## Technical Specs
- **Cognitive scores**: Baseline 90-100, decline 0-6 points/year + Gaussian noise
- **Stylus traces**: 1-3 drawings per timepoint, simulate slower/hesitant strokes as decline increases
- **Audio**: Use TTS or copy LibriSpeech samples (free, small files)
- **Dependencies**: numpy, pandas only (no ML libs yet)

## Success Criteria
- `data/synthetic/patients.json` exists with 20 patients
- `data/synthetic/timelines.csv` has cognitive scores for all patients
- `data/synthetic/stylus_traces/` contains JSON files with stroke data
- `data/sample_audio/` contains 5 WAV files
- Data generator is rerunnable and produces consistent output
