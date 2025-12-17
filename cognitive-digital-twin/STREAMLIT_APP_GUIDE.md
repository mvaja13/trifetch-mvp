# Streamlit App User Guide

## Quick Start

### 1. Launch the App
```bash
# Activate virtual environment
source .venv/bin/activate

# Run the Streamlit app
streamlit run src/app.py
```

The app will open automatically in your browser at `http://localhost:8501`

### 2. Using the App

#### Patient Selection
1. Use the **dropdown in the sidebar** to select a patient (P001 - P020)
2. Patient information will display below the selector

#### View Predictions
The main plot shows:
- **Blue dots**: Historical cognitive scores (0, 6, 12 months)
- **Orange line**: Predicted cognitive trajectory (18, 24 months)
- **Shaded area**: 95% confidence interval
- **Green squares**: Actual scores (when available)

#### What-If Scenarios
Adjust lifestyle factors using the sliders:

1. **Sleep Hours Adjustment** (-2 to +2 hours)
   - Positive values: More sleep → slower decline
   - Negative values: Less sleep → faster decline

2. **Physical Activity Adjustment** (-20% to +20%)
   - Positive values: More activity → slower decline
   - Negative values: Less activity → faster decline

#### Interpreting Results
- **Baseline Forecast**: Predictions without interventions
- **With Interventions**: Adjusted predictions based on sliders
- **Impact Analysis**: Shows the difference between scenarios
- **Confidence Intervals**: Indicates prediction uncertainty

### 3. Features

#### Interactive Visualizations
- Real-time updates when sliders change
- Comparison of baseline vs intervention scenarios
- Clear legends and labels

#### Prediction Tables
- Numerical values for all predictions
- 95% confidence intervals
- Impact metrics for interventions

#### Information Expanders
- **About This Demo**: System overview and methodology
- **Technical Details**: Model architecture and training info

## Example Workflow

### Scenario: Evaluating Sleep Intervention

1. **Select a patient** (e.g., P005)
2. **View baseline prediction**
   - Note the predicted scores at 18m and 24m
3. **Adjust sleep hours** to +2 hours
4. **Observe changes**:
   - Orange line shifts upward (better outcomes)
   - Gray dashed line shows original baseline
   - Impact metrics show point improvement
5. **Interpret**:
   - +2 hours sleep → 10% slower decline
   - Predicted 24m score improves by ~X points

### Scenario: Combined Interventions

1. **Select a patient** with moderate decline
2. **Adjust both sliders**:
   - Sleep: +1.5 hours
   - Activity: +15%
3. **View combined effect**:
   - Decline factor: ~0.88x
   - ~12% reduction in decline rate
4. **Use for counseling**:
   - Show patient potential benefit
   - Quantify intervention impact

## Tips for Best Experience

### Performance
- App loads models on first run (may take 5-10 seconds)
- Subsequent interactions are fast (<1 second)
- No GPU required

### Navigation
- Use sidebar for all controls
- Main area shows results
- Scroll down for additional info

### Troubleshooting

**App won't start:**
```bash
# Check if streamlit is installed
pip list | grep streamlit

# Reinstall if needed
pip install streamlit
```

**Port already in use:**
```bash
# Use a different port
streamlit run src/app.py --server.port 8502
```

**Model not found:**
```bash
# Ensure checkpoint exists
ls checkpoints/best_model.pt

# If missing, run training
python src/train.py --epochs 20
```

## Advanced Usage

### Running on Different Port
```bash
streamlit run src/app.py --server.port 8502
```

### Headless Mode (Server Deployment)
```bash
streamlit run src/app.py --server.headless true
```

### Custom Browser
```bash
streamlit run src/app.py --browser.serverAddress localhost
```

## Understanding the Predictions

### Confidence Intervals
- **Narrow CI**: Model is confident (low uncertainty)
- **Wide CI**: Model is uncertain (high uncertainty)
- 95% CI means: 95% probability true value is in range

### Decline Factor
- **1.0**: No change (baseline)
- **0.9**: 10% slower decline (interventions help)
- **1.1**: 10% faster decline (risk factors worsen)

### Typical Results
Most patients show predictions around 85-90 points at 24m
- Reflects the training data distribution
- Individual variation based on patient history

## Exporting Results

### Screenshots
1. Use browser's screenshot feature
2. Capture the plot for reports
3. Include in presentations

### Predictions CSV
For batch analysis, use the CLI:
```bash
python src/infer.py --all --output results.csv
```

## Keyboard Shortcuts

Streamlit provides built-in shortcuts:
- `R`: Rerun the app
- `C`: Clear cache
- `?`: Show help menu

## Demo Tips

### For Presentations
1. **Start with a high-risk patient** (high decline rate)
2. **Show baseline trajectory** (declining scores)
3. **Apply interventions** (sleep + activity)
4. **Highlight improvements** (numbers and visual)
5. **Discuss uncertainty** (confidence intervals)

### For Stakeholders
- Focus on the what-if scenarios
- Emphasize clinical utility
- Show quantified impact
- Discuss scalability

### For Technical Audiences
- Open the Technical Details expander
- Discuss model architecture
- Explain MC dropout for confidence
- Show inference performance

## Next Steps

After exploring the app, you can:
1. **Review Phase 6** for Jupyter notebook demos
2. **Export predictions** for further analysis
3. **Integrate with EHR** systems (future work)
4. **Collect feedback** from clinicians

## Support

For issues or questions:
- Check `PHASE_5_COMPLETE.md` for detailed documentation
- Review `src/app.py` source code
- Run inference script for debugging: `python src/infer.py --patient_id P001`

---

**Note**: This demo uses synthetic data. Real-world deployment requires:
- Clinical data collection
- Model retraining on real data
- Regulatory compliance (HIPAA, GDPR)
- Clinical validation studies
