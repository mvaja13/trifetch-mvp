# Phase 2: Audio & Stylus Embeddings

## Goal
Extract fixed-size embeddings from audio (wav2vec2) and stylus traces.

## Deliverables
1. `src/audio_embed.py` - wav2vec2 embedding extractor
2. `src/stylus_embed.py` - stylus feature extractor & encoder
3. Precomputed embeddings for all synthetic patients saved as .npy files

## Tasks
- [ ] Implement audio_embed.py:
  - Load WAV using torchaudio
  - Use `facebook/wav2vec2-base-960h` from Hugging Face
  - Mean-pool last hidden states → 128-d embedding
  - Save as `data/synthetic/audio_embeddings/{patient_id}_{time}.npy`
- [ ] Implement stylus_embed.py:
  - Read stylus JSON
  - Extract handcrafted features: avg_speed, std_speed, total_time, avg_pressure, hesitation_count, stroke_smoothness
  - Map features to 128-d via small PyTorch MLP
  - Save as `data/synthetic/stylus_embeddings/{patient_id}_{time}.npy`
- [ ] Create helper script to batch-process all synthetic patients
- [ ] Test: Verify embedding shapes are (128,) and saved correctly

## Technical Specs
- **Audio embedding**: wav2vec2-base-960h, output dim = 128
- **Stylus embedding**: 6 handcrafted features → MLP → 128-d
- **Hesitation**: count pauses where dt > 100ms
- **Smoothness**: curvature metric (change in direction)
- **Dependencies**: Add torch, torchaudio, transformers to requirements.txt

## Success Criteria
- `data/synthetic/audio_embeddings/` contains .npy files for all patients/timepoints
- `data/synthetic/stylus_embeddings/` contains .npy files for all patients/timepoints
- Each embedding is shape (128,) and float32
- Embeddings can be loaded with `np.load()` and are numerically valid
