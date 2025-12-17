# Cognitive Decline Prediction System

**Multimodal AI for Alzheimer's Disease Forecasting**

An end-to-end machine learning system that predicts cognitive decline using speech and handwriting biomarkers.

---

## 🎯 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Launch interactive demo
streamlit run src/app.py

# Run inference
python src/infer.py --patient_id P001
```

---

## 📊 Overview

Predicts cognitive decline 12-24 months in advance using multimodal biomarkers.

**Performance:**
- Test MAE: 2.87 points
- Inference: 50ms per patient
- Model: 398K parameters

**Features:**
- Multimodal fusion (audio + handwriting)
- Confidence intervals (MC-dropout)
- What-if scenario analysis
- Interactive Streamlit app

---

## 🏗️ Architecture

```
Audio (Speech) ──► wav2vec2 ──┐
                                ├──► Fusion ──► GRU ──► Predictions
Stylus (Writing) ─► Features ──┘    (Transformer)      (18m, 24m)
```

**Models:**
1. wav2vec2: Speech embeddings (128-d)
2. MLP: Stylus embeddings (128-d)
3. Transformer: Multimodal fusion (331K params)
4. GRU: Forecasting (67K params)

---

## 📁 Structure

```
cognitive-digital-twin/
├── src/               # Source code
│   ├── train.py       # Training loop
│   ├── infer.py       # Inference script
│   └── app.py         # Streamlit app
├── data/              # Synthetic patient data
├── checkpoints/       # Trained models
├── notebooks/         # Demo notebook
└── demo_assets/       # Video storyboard
```

---

## 🚀 Usage

### Training
```bash
python src/train.py --epochs 20
```

### Inference
```bash
python src/infer.py --patient_id P001
python src/infer.py --all --output predictions.csv
```

### Demo App
```bash
streamlit run src/app.py
```

---

## 📈 Results

**Dataset:** 20 synthetic patients

**Metrics:**
- Test MAE: 2.87 points
- Test RMSE: 3.21 points  
- Training: 11 epochs, 1 minute (CPU)

**Example:**
```
Patient P001 (Age 85, Decline 4.45 pts/year):
  18m: 89.57 (95% CI: [89.47, 89.67])
  24m: 89.32 (95% CI: [89.22, 89.41])
```

---

## 📚 Documentation

- **PHASE_*_COMPLETE.md** - Phase completion reports
- **STREAMLIT_APP_GUIDE.md** - App usage guide
- **demo_assets/** - Video storyboard and recording instructions
- **notebooks/demo_pipeline.ipynb** - End-to-end demo

---

## ⚠️ Disclaimer

For research and demonstration purposes only. Not a medical device.

---

**Built by:** Trifetch ML Team  
**Version:** 1.0.0  
**Date:** December 2025
