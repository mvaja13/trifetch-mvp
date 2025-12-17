# Linus ML Twin MVP - Build Plan

## Overview
This project is structured into **6 phases** for iterative development. Each phase has its own detailed document.

## Build Order

### Phase 1: Data Generation & Setup
**File**: `PHASE_1_DATA_GENERATION.md`
**Focus**: Project structure, synthetic data, requirements
**Time**: ~30-45 min
**Status**: Not started

### Phase 2: Audio & Stylus Embeddings
**File**: `PHASE_2_EMBEDDINGS.md`
**Focus**: Extract wav2vec2 and stylus embeddings
**Time**: ~45-60 min
**Depends on**: Phase 1
**Status**: Not started

### Phase 3: Fusion & Forecasting Models
**File**: `PHASE_3_FUSION_FORECAST.md`
**Focus**: Build fusion transformer + GRU forecast head
**Time**: ~45-60 min
**Depends on**: Phase 2
**Status**: Not started

### Phase 4: Training Pipeline
**File**: `PHASE_4_TRAINING.md`
**Focus**: Train models, evaluate, save checkpoints
**Time**: ~30-45 min
**Depends on**: Phase 3
**Status**: Not started

### Phase 5: Inference & Streamlit App
**File**: `PHASE_5_INFERENCE_APP.md`
**Focus**: Build inference pipeline + interactive demo
**Time**: ~45-60 min
**Depends on**: Phase 4
**Status**: Not started

### Phase 6: Demo Notebook & Final Polish
**File**: `PHASE_6_DEMO_NOTEBOOK.md`
**Focus**: End-to-end notebook, demo script, outreach materials
**Time**: ~30-45 min
**Depends on**: Phase 5
**Status**: Not started

## How to Use

1. **Review each phase document** before starting
2. **Tell me which phase to build** (e.g., "build phase 1" or "start with PHASE_1_DATA_GENERATION.md")
3. **I'll implement that phase completely** before moving to the next
4. **Test each phase** before proceeding (I'll provide test commands)
5. **Iterate if needed** - we can refine any phase before moving forward

## Quick Start Command

To begin Phase 1, just say:
```
Build Phase 1
```

Or reference the doc directly:
```
Implement @PHASE_1_DATA_GENERATION.md
```

## Total Estimated Time
**4-6 hours** for complete MVP (all 6 phases)

## Notes
- Each phase is designed to be **independently testable**
- You can pause between phases and resume later
- Phases can be refined/iterated before moving to the next
- All code will be CPU-friendly and Colab-compatible
