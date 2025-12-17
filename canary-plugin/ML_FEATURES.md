# 🤖 ML Features Documentation

## Overview

The Canary Wellbeing Insights platform now includes advanced **Machine Learning-powered features** for predictive health analytics and intelligent recommendations. This is a **prototype implementation** demonstrating ML capabilities without requiring actual trained models.

## 🎯 ML Features Implemented

### 1. **Predictive Burnout Analytics** 🔮
- **What it does**: Forecasts future burnout risks based on current stress/fatigue trends
- **Technology simulated**: Time-series forecasting (LSTM/Prophet-style)
- **Key insights**:
  - Predicts burnout probability with confidence scores
  - Estimates timeline for potential burnout events
  - Identifies departments trending toward critical risk levels
  - Detects improving trends and positive patterns

**Example output**:
```json
{
  "type": "critical",
  "title": "Critical Burnout Risk Predicted: Engineering",
  "description": "ML models predict 85% probability of increased burnout within 2 weeks. Stress velocity +12%/week.",
  "confidence": 0.85,
  "affectedDepartments": ["Engineering"],
  "predictedDate": "2025-12-27"
}
```

### 2. **Anomaly Detection** 🔍
- **What it does**: Identifies unusual patterns in stress and fatigue metrics
- **Technology simulated**: Isolation Forest / Autoencoder
- **Key capabilities**:
  - Detects significant deviations from baseline metrics
  - Calculates expected vs actual values
  - Assigns severity levels (low/medium/high)
  - Flags departments requiring immediate attention

**Example output**:
```json
{
  "detected": true,
  "department": "Sales",
  "metric": "stress",
  "currentValue": 72,
  "expectedValue": 60,
  "deviation": 20,
  "severity": "high"
}
```

### 3. **Health Risk Scoring** 📊
- **What it does**: Calculates a composite health risk score (0-100)
- **Technology simulated**: Gradient Boosting (XGBoost/LightGBM-style)
- **Scoring factors**:
  - Current stress levels (30% weight)
  - Fatigue index (25% weight)
  - Burnout rate (25% weight)
  - Trend velocity (20% weight)
- **Risk levels**: Low, Moderate, High, Critical
- **Trend analysis**: Improving, Stable, Declining

**Example output**:
```json
{
  "overall_score": 62,
  "risk_level": "high",
  "trend": "declining",
  "contributing_factors": [
    {
      "factor": "Current Stress Level",
      "weight": 0.30,
      "impact": 0.62
    }
  ]
}
```

### 4. **AI-Powered Recommendations** 💡
- **What it does**: Generates context-aware action items prioritized by urgency
- **Technology simulated**: Rule-based + Collaborative filtering
- **Recommendation types**:
  - **Intervention**: Immediate actions for critical situations
  - **Prevention**: Proactive measures to avoid escalation
  - **Monitoring**: Tracking for improving trends
- **Priority levels**: High, Medium, Low

**Example output**:
```json
{
  "priority": "high",
  "category": "intervention",
  "action": "Immediate intervention required for Engineering: Schedule 1-on-1 check-ins and reduce meeting load by 30%",
  "expectedImpact": "Predicted stress reduction of 15-20 points within 2 weeks",
  "targetDepartments": ["Engineering"]
}
```

### 5. **Department Clustering** 🎯
- **What it does**: Groups departments by similar health patterns
- **Technology simulated**: K-means clustering
- **Clusters**:
  - **High Risk**: Departments needing immediate attention
  - **Moderate Risk**: Departments requiring preventive action
  - **Healthy**: Departments with sustainable patterns
- **Use case**: Identify departments that can share best practices

---

## 🛠 Technical Implementation

### File Structure

```
canary-plugin/
├── lib/
│   └── ml-models.ts                 # ML algorithms (hardcoded logic)
├── app/api/v1/
│   └── ml-insights/
│       └── route.ts                 # ML API endpoint
└── components/
    └── MLInsights.tsx               # ML Dashboard UI
```

### API Endpoint

**GET** `/api/v1/ml-insights`

Returns comprehensive ML analysis:

```json
{
  "timestamp": "2025-12-13T...",
  "model_version": "v1.0.0-prototype",
  "insights": {
    "predictive": [...],
    "anomalies": [...],
    "health_risk": {...},
    "recommendations": [...],
    "clusters": {...}
  },
  "metadata": {
    "departments_analyzed": 5,
    "data_points": 30,
    "confidence_threshold": 0.65
  }
}
```

---

## 🚀 How to Use

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Navigate to ML Insights tab** in the dashboard

3. **Explore the features**:
   - View overall health risk score
   - Check predictive burnout warnings
   - Review anomaly alerts
   - Read AI-generated recommendations
   - See department clustering analysis

---

## 🧪 ML Models Simulated

The following ML techniques are demonstrated with intelligent hardcoded logic:

| Feature | ML Technique | Real-World Library |
|---------|--------------|-------------------|
| Predictive Analytics | LSTM / Prophet | TensorFlow, Prophet |
| Anomaly Detection | Isolation Forest | Scikit-learn |
| Risk Scoring | Gradient Boosting | XGBoost, LightGBM |
| Clustering | K-means | Scikit-learn |
| Recommendations | Collaborative Filtering | Surprise, TensorFlow |

---

## 🔄 Upgrading to Real ML Models

To replace the prototype with actual ML models:

### Option 1: TensorFlow.js (Browser-based)
```typescript
import * as tf from '@tensorflow/tfjs';

async function predictBurnout(features: number[]) {
  const model = await tf.loadLayersModel('/models/burnout-model.json');
  const prediction = model.predict(tf.tensor2d([features]));
  return prediction.dataSync()[0];
}
```

### Option 2: ONNX Runtime (Portable)
```typescript
import * as ort from 'onnxruntime-web';

const session = await ort.InferenceSession.create('/models/anomaly-detector.onnx');
const results = await session.run(inputTensor);
```

### Option 3: Python Backend (Most Powerful)
```python
# backend/ml_service.py
from prophet import Prophet
import pandas as pd

def forecast_burnout(historical_data):
    model = Prophet()
    model.fit(historical_data)
    future = model.make_future_dataframe(periods=14)
    forecast = model.predict(future)
    return forecast
```

Then call from Next.js:
```typescript
const response = await fetch('http://localhost:8000/api/ml/predict', {
  method: 'POST',
  body: JSON.stringify({ data: trendData })
});
```

---

## 📈 Sample Data Flow

```
User Opens ML Insights Tab
         ↓
Frontend calls /api/v1/ml-insights
         ↓
API fetches department stats
         ↓
ML models process data:
  - Predictive model analyzes trends
  - Anomaly detector flags outliers
  - Risk scorer calculates composite score
  - Recommender generates actions
  - Clustering groups departments
         ↓
API returns comprehensive insights
         ↓
Dashboard displays visualizations
```

---

## 🎨 UI Components

### Health Risk Score Gauge
- Large circular score display (0-100)
- Color-coded by risk level
- Trend indicator (improving/declining)
- Contributing factors breakdown

### Predictive Insights Cards
- Color-coded by severity
- Confidence percentage
- Affected departments
- Predicted timeline

### Anomaly Detection Table
- Department comparison
- Expected vs actual values
- Deviation percentage
- Severity badges

### Recommendations List
- Priority badges
- Category tags
- Expected impact
- Target departments

### Clustering Groups
- Visual grouping by risk level
- Department counts
- Characteristics summary
- Recommended actions

---

## 🔐 Privacy & Ethics

All ML insights are:
- **Aggregated**: No individual employee tracking
- **Anonymous**: Department-level analysis only
- **Opt-in**: Requires user consent
- **Transparent**: Model explanations provided
- **Actionable**: Focus on systemic improvements

---

## 📊 Performance Considerations

### Current Implementation (Prototype)
- **Response time**: < 50ms
- **Client-side**: All rendering
- **No database**: Hardcoded data
- **Scalability**: Limited to small datasets

### Production Recommendations
- **Caching**: Redis for ML predictions
- **Batch processing**: Pre-compute daily insights
- **Model serving**: Dedicated ML service
- **Database**: Store historical predictions
- **Monitoring**: Track model performance

---

## 🚀 Future Enhancements

### Short-term
- [ ] Add confidence intervals to predictions
- [ ] Implement rolling window analysis
- [ ] Create custom alerts/notifications
- [ ] Export ML insights to PDF

### Long-term
- [ ] Train actual models on real data
- [ ] Implement A/B testing for interventions
- [ ] Add individual employee insights (with consent)
- [ ] Build recommendation feedback loop
- [ ] Integrate with HR systems

---

## 🤝 Contributing

To add new ML features:

1. **Define the algorithm** in `lib/ml-models.ts`
2. **Add API endpoint** in `app/api/v1/ml-insights/route.ts`
3. **Create UI component** in `components/MLInsights.tsx`
4. **Update types** if needed
5. **Document the feature** in this file

---

## 📚 References

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [Scikit-learn ML Guide](https://scikit-learn.org/stable/user_guide.html)
- [Prophet Forecasting](https://facebook.github.io/prophet/)
- [ONNX Runtime](https://onnxruntime.ai/)

---

## ℹ️ Disclaimer

This is a **prototype implementation** for demonstration purposes. The ML models use intelligent hardcoded logic to simulate real machine learning behavior. In production, these should be replaced with actual trained models using real employee wellbeing data (with proper consent and privacy safeguards).

---

**Built by Gautam for Trifetch Product Trial**
*Demonstrating ML capabilities for canary health monitoring*
