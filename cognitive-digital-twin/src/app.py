"""
Streamlit App for Cognitive Decline Prediction (Pro Version)

Interactive demo app showing:
- Patient selection
- Historical cognitive scores
- Predicted future scores with confidence bands
- What-if scenario analysis
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
import json
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

from infer import CognitiveDeclinePredictor

# Page configuration
st.set_page_config(
    page_title="Linus ML Twin",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Light Theme with Blue & White
st.markdown("""
<style>
    /* Main Background & Font */
    .stApp {
        background-color: #ffffff;
        font-family: 'Inter', sans-serif;
    }

    /* Headings */
    h1, h2, h3 {
        color: #1e293b !important;
        font-weight: 600 !important;
    }

    /* Cards (Metrics) */
    div[data-testid="stMetric"] {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    div[data-testid="stMetricLabel"] {
        color: #64748b !important;
        font-size: 0.9rem !important;
    }
    div[data-testid="stMetricValue"] {
        color: #1e293b !important;
        font-size: 1.6rem !important;
    }

    /* Sidebar */
    section[data-testid="stSidebar"] {
        background-color: #f0f9ff;
        border-right: 1px solid #e2e8f0;
    }

    /* Success/Warning Messages */
    .stAlert {
        background-color: #f8fafc;
        color: #1e293b;
        border: 1px solid #e2e8f0;
    }

    /* Custom divider */
    hr {
        border-color: #e2e8f0;
    }

    /* Buttons */
    .stButton>button {
        background-color: #3b82f6;
        color: white;
        border-radius: 8px;
        border: none;
        padding: 0.5rem 1rem;
        font-weight: 500;
        transition: all 0.2s;
    }
    .stButton>button:hover {
        background-color: #2563eb;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
    }

    /* Selectbox */
    .stSelectbox > div > div {
        background-color: #ffffff;
        color: #1e293b;
    }
    .stSelectbox label {
        color: #1e293b !important;
    }

    /* Sliders */
    .stSlider label {
        color: #1e293b !important;
    }
    .stSlider > div > div > div {
        color: #1e293b;
    }

    /* Text and labels */
    p, label, .stMarkdown {
        color: #1e293b;
    }

</style>
""", unsafe_allow_html=True)

@st.cache_resource
def load_predictor():
    """Load predictor (cached)"""
    return CognitiveDeclinePredictor()

@st.cache_data
def load_patient_data():
    """Load patient metadata and timelines"""
    with open('data/synthetic/patients.json', 'r') as f:
        patients = json.load(f)
    timelines = pd.read_csv('data/synthetic/timelines.csv')
    return patients, timelines

def create_trajectory_chart(result, baseline_result=None):
    """
    Create specific Plotly chart for patient trajectory
    """
    fig = go.Figure()

    # 1. Confidence Band (10th-90th Percentile)
    # We construct a fill by plotting upper then lower reversed
    pred_t = result['predicted_timepoints']
    pred_s = result['predicted_scores']
    
    # Connect to last historical point for continuity
    last_hist_t = result['historical_timepoints'][-1]
    last_hist_s = result['historical_scores'][-1]
    
    full_pred_t = [last_hist_t] + pred_t
    
    ci_lower = [last_hist_s] + result['ci_lower']
    ci_upper = [last_hist_s] + result['ci_upper']
    
    fig.add_trace(go.Scatter(
        x=full_pred_t + full_pred_t[::-1],
        y=ci_upper + ci_lower[::-1],
        fill='toself',
        fillcolor='rgba(234, 88, 12, 0.2)', # Orange with opacity
        line=dict(color='rgba(255,255,255,0)'),
        hoverinfo="skip",
        showlegend=True,
        name='10th-90th Percentile CI'
    ))

    # 2. Predicted Trajectory (Line)
    full_pred_s = [last_hist_s] + pred_s
    fig.add_trace(go.Scatter(
        x=full_pred_t,
        y=full_pred_s,
        mode='lines+markers',
        line=dict(color='#ea580c', width=3), # Orange
        marker=dict(size=8),
        name='Predicted Trajectory'
    ))
    
    # 3. Historical Scores (Dots)
    fig.add_trace(go.Scatter(
        x=result['historical_timepoints'],
        y=result['historical_scores'],
        mode='markers',
        marker=dict(color='#3b82f6', size=12, line=dict(width=2, color='#1e293b')), # Blue with dark border
        name='Historical Scores'
    ))

    # 4. Actual Scores (if available) - Comparison
    if result['actual_scores'] is not None:
        fig.add_trace(go.Scatter(
            x=result['predicted_timepoints'],
            y=result['actual_scores'],
            mode='markers',
            marker=dict(color='#10b981', symbol='square', size=10), # Green
            name='Actual Outcome'
        ))

    # 5. Baseline (if exploring what-if)
    if baseline_result is not None:
        base_t = baseline_result['historical_timepoints'][-1:] + baseline_result['predicted_timepoints']
        base_s = baseline_result['historical_scores'][-1:] + baseline_result['predicted_scores']
        fig.add_trace(go.Scatter(
            x=base_t,
            y=base_s,
            mode='lines',
            line=dict(color='#9ca3af', width=2, dash='dot'), # Gray dotted
            name='Baseline (No Intervention)'
        ))

    # Layout Styling
    fig.update_layout(
        title=dict(text='Cognitive Decline Trajectory', font=dict(size=20, color='#1e293b')),
        xaxis=dict(
            title='Time (months)',
            showgrid=True,
            gridcolor='#e2e8f0',
            zeroline=False,
            dtick=6,
            color='#1e293b'
        ),
        yaxis=dict(
            title='Cognitive Score',
            showgrid=True,
            gridcolor='#e2e8f0',
            range=[65, 100],
            zeroline=False,
            color='#1e293b'
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='#ffffff',
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(color='#1e293b')
        ),
        margin=dict(l=40, r=40, t=80, b=40),
        hovermode="x unified"
    )

    # Add annotation for prediction start
    fig.add_vline(x=last_hist_t, line_width=1, line_dash="dash", line_color="#ef4444")
    fig.add_annotation(x=last_hist_t, y=70, text="Prediction Start", showarrow=False, xshift=10, font=dict(color="#ef4444"))

    return fig

def main():
    # Load Data
    try:
        predictor = load_predictor()
        patients, timelines = load_patient_data()
    except Exception as e:
        st.error(f"Error loading system: {e}")
        st.stop()

    # --- Sidebar ---
    # Compact Header
    c1, c2 = st.sidebar.columns([1, 4])
    with c1:
        st.image("https://img.icons8.com/color/48/000000/brain--v1.png", width=40)
    with c2:
        st.markdown("<h3 style='margin: 0; padding-top: 5px; color: #1e293b;'>Linus ML Twin</h3>", unsafe_allow_html=True)

    st.sidebar.markdown("<hr style='margin: 10px 0; border-color: #e2e8f0;'>", unsafe_allow_html=True)
    
    # Compact Patient Select
    patient_ids = [p['patient_id'] for p in patients]
    selected_patient_id = st.sidebar.selectbox("Select Patient", patient_ids)
    
    patient_info = next(p for p in patients if p['patient_id'] == selected_patient_id)
    
    # Compact Profile (Grid style)
    st.sidebar.markdown(f"""
    <div style="background-color: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748b;">Age:</span>
            <span style="color: #1e293b;">{patient_info['age']}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748b;">Baseline:</span>
            <span style="color: #1e293b;">{patient_info['baseline_score']:.1f}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Decline Rate:</span>
            <span style="color: #1e293b;">{patient_info['decline_rate']:.2f}/yr</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.sidebar.markdown("<hr style='margin: 15px 0; border-color: #e2e8f0;'>", unsafe_allow_html=True)
    st.sidebar.markdown("<p style='color: #1e293b; font-weight: 600; margin-bottom: 10px;'>Simulation</p>", unsafe_allow_html=True)
    
    # Compact Simulation Controls
    sleep_adj = st.sidebar.slider("Sleep (hrs)", -2.0, 2.0, 0.0, 0.5)
    activity_adj = st.sidebar.slider("Activity (%)", -20, 20, 0, 5)
    
    # Calculate factor
    decline_factor = 1.0 - (sleep_adj * 0.05) - (activity_adj * 0.002)
    decline_factor = max(0.5, min(1.5, decline_factor))
    
    if decline_factor != 1.0:
        st.sidebar.success(f"Decline Factor: **{decline_factor:.2f}x**")
    
    # --- Main Area ---
    
    # Header
    col_h1, col_h2 = st.columns([3, 1])
    with col_h1:
        st.title(f"Patient {selected_patient_id}: Clinical Dashboard")
    with col_h2:
        st.markdown(f"<div style='text-align: right; padding-top: 20px; color: #6b7280;'>Last Update: T12</div>", unsafe_allow_html=True)

    # Predictions Calculation
    baseline_result = predictor.predict_patient(selected_patient_id, n_samples=20, decline_factor=1.0)
    
    adjusted_result = None
    if decline_factor != 1.0:
        adjusted_result = predictor.predict_patient(selected_patient_id, n_samples=20, decline_factor=decline_factor)
        current_result = adjusted_result
    else:
        current_result = baseline_result

    # 1. Top Level Metrics
    m1, m2, m3, m4 = st.columns(4)
    
    last_score = current_result['historical_scores'][-1]
    pred_24m = current_result['predicted_scores'][1]
    total_change = pred_24m - last_score
    risk_level = "High" if pred_24m < 85 else "Moderate" if pred_24m < 90 else "Low"
    risk_color = "#ef4444" if risk_level == "High" else "#f59e0b" if risk_level == "Moderate" else "#10b981"
    
    with m1:
        st.metric("Current Score (12m)", f"{last_score:.1f}")
    with m2:
        st.metric("Forecast (24m)", f"{pred_24m:.1f}", f"{total_change:.1f}")
    with m3:
        # Custom HTML for colored metric
        st.markdown(f"""
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
            <div style="color: #64748b; font-size: 0.9rem;">Risk Level</div>
            <div style="color: {risk_color}; font-size: 1.6rem; font-weight: 600;">{risk_level}</div>
        </div>
        """, unsafe_allow_html=True)
    with m4:
         # Uncertainty Metric
         uncertainty_range = current_result['ci_upper'][1] - current_result['ci_lower'][1]
         st.metric("Uncertainty (Range)", f"±{uncertainty_range/2:.1f} pts")

    st.markdown("---")

    # 2. Main Chart Area
    c1, c2 = st.columns([3, 1])
    
    with c1:
        chart = create_trajectory_chart(current_result, baseline_result if decline_factor != 1.0 else None)
        st.plotly_chart(chart, use_container_width=True)
        
    with c2:
        st.subheader("Forecast Details")
        st.markdown(f"""
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 5px;">18 Month Prediction</p>
            <div style="font-size: 1.4rem; color: #1e293b; font-weight: 600;">{current_result['predicted_scores'][0]:.1f}</div>
            <div style="font-size: 0.85rem; color: #64748b;">CI: {current_result['ci_lower'][0]:.1f} - {current_result['ci_upper'][0]:.1f}</div>
            <hr style="border-color: #e2e8f0; margin: 15px 0;">
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 5px;">24 Month Prediction</p>
            <div style="font-size: 1.4rem; color: #1e293b; font-weight: 600;">{current_result['predicted_scores'][1]:.1f}</div>
            <div style="font-size: 0.85rem; color: #64748b;">CI: {current_result['ci_lower'][1]:.1f} - {current_result['ci_upper'][1]:.1f}</div>
        </div>
        """, unsafe_allow_html=True)
        
        if decline_factor != 1.0:
            impact = pred_24m - baseline_result['predicted_scores'][1]
            st.markdown(f"""
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid #10b981;">
                <p style="color: #065f46; font-size: 0.85rem; margin-bottom: 5px;">Intervention Impact</p>
                <div style="font-size: 1.2rem; color: #047857; font-weight: 600;">+{impact:.2f} points</div>
                <div style="font-size: 0.8rem; color: #059669;">preserved at 24m</div>
            </div>
            """, unsafe_allow_html=True)

    # 3. Data Inspection
    with st.expander("🔍 Detailed Data View"):
        df_cols = st.columns(2)
        with df_cols[0]:
            st.markdown("##### New Modalities (Passive)")
            # Mock display of passive features
             # Get real data from timeline for this patient
            p_timeline = timelines[timelines['patient_id'] == selected_patient_id]
            st.dataframe(
                p_timeline[['timepoint_months', 'typing_flight_time', 'gait_variability']].style.background_gradient(cmap='viridis'),
                use_container_width=True,
                hide_index=True
            )
        with df_cols[1]:
            st.markdown("##### Prediction Table")
            pred_data = {
                "Timepoint": ["18m", "24m"],
                "Forecast": current_result['predicted_scores'],
                "Lower CI (10%)": current_result['ci_lower'],
                "Upper CI (90%)": current_result['ci_upper']
            }
            # Format only numeric columns
            st.dataframe(
                pd.DataFrame(pred_data).style.format({
                    "Forecast": "{:.2f}",
                    "Lower CI (10%)": "{:.2f}",
                    "Upper CI (90%)": "{:.2f}"
                }),
                use_container_width=True, 
                hide_index=True
            )

if __name__ == '__main__':
    main()
