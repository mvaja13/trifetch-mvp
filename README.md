# Trifetch Trial Projects

This repository contains four healthcare AI/ML demo projects developed for Trifetch product evaluation.

---

## 📁 Projects

### 🐦 [canary-plugin](./canary-plugin)
**AI-powered Corporate Wellbeing Dashboard**

Analyzes meeting audio (Zoom/Meet) to measure team stress, fatigue, and cognitive load using voice biomarker technology. Features HR dashboard with department comparison, stress trends, and burnout risk indicators.

- **Tech**: Next.js, TypeScript, Recharts
- **Purpose**: Corporate wellness monitoring via voice analysis
- **Status**: Mock API demo

---

### 🧠 [cognitive-digital-twin](./cognitive-digital-twin)
**Multimodal AI for Alzheimer's Disease Forecasting**

Predicts cognitive decline 12-24 months in advance using speech and handwriting biomarkers. Combines wav2vec2 audio embeddings with stylus features through transformer-based fusion.

- **Tech**: Python, PyTorch, Streamlit
- **Performance**: 2.87 MAE, 50ms inference
- **Features**: MC-dropout confidence intervals, what-if analysis

---

### 🫐 [blueberry-copilot](./blueberry-copilot)
**Pediatric Intake Summarization Tool**

AI-powered clinical intake assistant that summarizes pediatric patient information. Processes raw text input with age and temperature data to generate structured clinical summaries.

- **Tech**: Next.js, Google Generative AI, TypeScript
- **Purpose**: Streamline pediatric patient intake workflow
- **Features**: Timeline tracking, note augmentation

---

### 🤰 [Maternal Risk Monitor](./Maternal%20Risk%20Monitor)
**Maternal Health Risk Scoring System**

Patient risk assessment platform for tracking maternal health metrics during pregnancy. Manages gestational age, risk scores, and temporal risk tracking through CSV uploads.

- **Tech**: React + Vite (client), Node.js + Express + SQLite (server)
- **Purpose**: Monitor and track maternal health risk factors
- **Features**: CSV upload, patient timeline, risk classification

---

## 🚀 Getting Started

Each project has its own dependencies and setup. Navigate to the individual project directories for specific instructions.

**General setup:**
```bash
# For Node.js projects (canary-plugin, blueberry-copilot, Maternal Risk Monitor)
cd <project-directory>
npm install
npm run dev

# For Python projects (cognitive-digital-twin)
cd cognitive-digital-twin
pip install -r requirements.txt
streamlit run src/app.py
```

---

## ⚠️ Disclaimer

All projects are **demonstration MVPs** for research and evaluation purposes only. Not intended for clinical use or medical diagnosis.

---

**Author**: Gautam
**Date**: December 2024
