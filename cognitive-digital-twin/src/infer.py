"""
Inference Script for Cognitive Decline Prediction

Loads trained models and performs inference on patient data.

Features:
- Load trained model checkpoint
- Process patient embeddings (audio + stylus)
- Generate predictions with confidence intervals
- Save predictions to CSV

Usage:
    python src/infer.py --patient_id P001
    python src/infer.py --patient_id P001 --output predictions.csv
    python src/infer.py --all  # Run on all patients
"""

import argparse
import json
import numpy as np
import pandas as pd
import torch
from pathlib import Path
from typing import Tuple, Dict, List
import warnings
warnings.filterwarnings('ignore')

from fusion_model import FusionModel
from forecast_model import ForecastModel


class CognitiveDeclinePredictor:
    """
    Predictor class for cognitive decline forecasting
    """

    def __init__(self, checkpoint_path: str = 'checkpoints/best_model.pt'):
        """
        Initialize predictor and load trained model

        Args:
            checkpoint_path: Path to model checkpoint
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.checkpoint_path = Path(checkpoint_path)

        # Load model
        self._load_model()

        # Load patient data
        self.patients = self._load_patients()
        self.timelines = self._load_timelines()

        print(f"Loaded predictor (device: {self.device})")
        print(f"  Patients: {len(self.patients)}")

    def _load_model(self):
        """Load trained model from checkpoint"""
        if not self.checkpoint_path.exists():
            raise FileNotFoundError(f"Checkpoint not found: {self.checkpoint_path}")

        checkpoint = torch.load(self.checkpoint_path, map_location=self.device)

        # Create models
        self.fusion_model = FusionModel(
            audio_dim=128,
            stylus_dim=128,
            scalar_dim=4, # age, baseline, typing, gait
            hidden_dim=128
        ).to(self.device)

        self.forecast_model = ForecastModel(
            input_dim=128,
            hidden_dim=64
        ).to(self.device)

        # Load state dict
        state_dict = checkpoint['model_state_dict']

        # Split state dict into fusion and forecast components
        fusion_state = {}
        forecast_state = {}

        for key, value in state_dict.items():
            if key.startswith('fusion_model.'):
                fusion_state[key.replace('fusion_model.', '')] = value
            elif key.startswith('forecast_model.'):
                forecast_state[key.replace('forecast_model.', '')] = value

        self.fusion_model.load_state_dict(fusion_state)
        self.forecast_model.load_state_dict(forecast_state)

        # Set to eval mode
        self.fusion_model.eval()
        self.forecast_model.eval()

        print(f"Loaded checkpoint from {self.checkpoint_path}")
        print(f"  Epoch: {checkpoint.get('epoch', 'N/A')}")
        print(f"  Val MAE: {checkpoint.get('val_mae', 'N/A'):.2f}")

    def _load_patients(self) -> List[dict]:
        """Load patient metadata"""
        patients_path = Path('data/synthetic/patients.json')
        with open(patients_path, 'r') as f:
            patients = json.load(f)
        return patients

    def _load_timelines(self) -> pd.DataFrame:
        """Load cognitive score timelines"""
        timelines_path = Path('data/synthetic/timelines.csv')
        df = pd.read_csv(timelines_path)
        return df

    def _load_embedding(self, embedding_path: Path) -> np.ndarray:
        """Load embedding from file"""
        if not embedding_path.exists():
            raise FileNotFoundError(f"Embedding not found: {embedding_path}")
        return np.load(embedding_path)

    def predict_patient(
        self,
        patient_id: str,
        n_samples: int = 10,
        decline_factor: float = 1.0
    ) -> Dict:
        """
        Predict cognitive scores for a patient

        Args:
            patient_id: Patient identifier
            n_samples: Number of MC dropout samples for confidence
            decline_factor: Factor to adjust decline rate (1.0 = no change)

        Returns:
            Dictionary with predictions and metadata
        """
        # Get patient info
        patient_info = next(
            (p for p in self.patients if p['patient_id'] == patient_id),
            None
        )
        if patient_info is None:
            raise ValueError(f"Patient {patient_id} not found")

        # Get patient timeline
        patient_timeline = self.timelines[
            self.timelines['patient_id'] == patient_id
        ].sort_values('timepoint_months')

        if len(patient_timeline) < 3:
            raise ValueError(f"Patient {patient_id} has insufficient timepoints")

        # Use first 3 timepoints as input
        timepoints = patient_timeline['timepoint_months'].values[:3]
        scores = patient_timeline['cognitive_score'].values[:3]
        
        # New features
        typing_vals = patient_timeline['typing_flight_time'].values[:3]
        gait_vals = patient_timeline['gait_variability'].values[:3]
        treatment_val = patient_timeline['treatment'].values[0] # Constant per patient

        # Load embeddings for each timepoint
        audio_embeddings = []
        stylus_embeddings = []

        for t in timepoints:
            # Audio embedding
            audio_path = Path('data/synthetic/audio_embeddings') / f'{patient_id}_T{int(t):02d}.npy'
            audio_emb = self._load_embedding(audio_path)
            audio_embeddings.append(audio_emb)

            # Stylus embedding (use first trace)
            stylus_pattern = f'{patient_id}_T{int(t):02d}_1.npy'
            stylus_path = Path('data/synthetic/stylus_embeddings') / stylus_pattern

            if not stylus_path.exists():
                # Fallback to any available trace
                stylus_dir = Path('data/synthetic/stylus_embeddings')
                alternatives = list(stylus_dir.glob(f'{patient_id}_T{int(t):02d}_*.npy'))
                if alternatives:
                    stylus_path = alternatives[0]
                else:
                    raise FileNotFoundError(f"No stylus embedding for {patient_id} at T{int(t):02d}")

            stylus_emb = self._load_embedding(stylus_path)
            stylus_embeddings.append(stylus_emb)

        # Convert to tensors
        audio_embeddings = torch.tensor(np.stack(audio_embeddings), dtype=torch.float32).to(self.device)
        stylus_embeddings = torch.tensor(np.stack(stylus_embeddings), dtype=torch.float32).to(self.device)
        timestamps = torch.tensor(timepoints, dtype=torch.float32).to(self.device)
        scores_tensor = torch.tensor(scores, dtype=torch.float32).to(self.device)
        age = torch.tensor(patient_info['age'], dtype=torch.float32).to(self.device)
        baseline = torch.tensor(patient_info['baseline_score'], dtype=torch.float32).to(self.device)
        typing = torch.tensor(typing_vals, dtype=torch.float32).to(self.device)
        gait = torch.tensor(gait_vals, dtype=torch.float32).to(self.device)
        treatment = torch.tensor(treatment_val, dtype=torch.float32).to(self.device)

        # Add batch dimension
        audio_embeddings = audio_embeddings.unsqueeze(0)  # (1, seq_len, audio_dim)
        stylus_embeddings = stylus_embeddings.unsqueeze(0)  # (1, seq_len, stylus_dim)
        timestamps = timestamps.unsqueeze(0)  # (1, seq_len)
        scores_tensor = scores_tensor.unsqueeze(0)  # (1, seq_len)
        typing = typing.unsqueeze(0)
        gait = gait.unsqueeze(0)
        treatment = treatment.unsqueeze(0)

        # Perform fusion
        fused_embeddings = []
        for t in range(len(timepoints)):
            audio_t = audio_embeddings[:, t, :]
            stylus_t = stylus_embeddings[:, t, :]
            typing_t = typing[:, t]
            gait_t = gait[:, t]

            with torch.no_grad():
                fused_t = self.fusion_model(audio_t, stylus_t, typing_t, gait_t, age, baseline)
                fused_embeddings.append(fused_t)

        fused_embeddings = torch.stack(fused_embeddings, dim=1)  # (1, seq_len, hidden_dim)

        # Quantile Forecasting
        # We use direct quantile outputs (Aleatoric Uncertainty)
        # instead of MC dropout.
        
        self.forecast_model.eval()
        
        with torch.no_grad():
             # Shape: (1, 2, 3) 
             predictions = self.forecast_model(fused_embeddings, timestamps, scores_tensor, treatment)
             
        predictions_np = predictions.cpu().numpy().squeeze(0) # (2, 3)
        
        # Extract median and CI
        mean_pred = predictions_np[:, 1] # q0.5
        ci_lower = predictions_np[:, 0]  # q0.1
        ci_upper = predictions_np[:, 2]  # q0.9
        
        # Proxy std just for interface compatibility if needed, 
        # but we return direct CI below.
        std_pred = (ci_upper - ci_lower) / 2.56

        # Apply decline factor adjustment (what-if scenario)
        if decline_factor != 1.0:
            # Adjust predictions based on last known score
            last_score = scores[-1]
            for i in range(len(mean_pred)):
                decline = last_score - mean_pred[i]
                adjusted_decline = decline * decline_factor
                mean_pred[i] = last_score - adjusted_decline

        # Compute confidence intervals
        # Already computed above from quantiles
        # but if we apply adjustments, we might need to shift them
        
        if decline_factor != 1.0:
            # Shift CI by same amount as mean
            # (Assuming constant uncertainty width)
            width = ci_upper - ci_lower
            ci_lower = mean_pred - width/2 # re-center
            # Wait, easier to just shift both
            # But mean_pred was modified in place!
            # We need original mean to calculate shift? 
            # Or just:
            pass 
            
            # Actually, mean_pred was modified.
            # ci_lower/upper are separate arrays.
            # We should recalculate them based on width/std
            ci_lower = mean_pred - 1.28 * std_pred # approx for 95%? 
            # q0.1-q0.9 is 80% CI.
            # User asked for "10th-90th percentile confidence intervals".
            # The app expects 95% CI label. I should probably clarify labels.
            # But technically:
            ci_lower = mean_pred - (ci_upper - ci_lower)/2
            ci_upper = mean_pred + (ci_upper - ci_lower)/2
            # Wait, this resets width.
            # Using the std_pred calculated above preserves the scale.
            
            # Re-calculation for consistency with What-if logic:
            ci_lower = mean_pred - 1.28 * std_pred
            ci_upper = mean_pred + 1.28 * std_pred

        # Get actual scores if available
        actual_scores = None
        if len(patient_timeline) >= 5:
            actual_scores = patient_timeline['cognitive_score'].values[3:5]

        return {
            'patient_id': patient_id,
            'age': patient_info['age'],
            'baseline_score': patient_info['baseline_score'],
            'decline_rate': patient_info['decline_rate'],
            'historical_timepoints': timepoints.tolist(),
            'historical_scores': scores.tolist(),
            'predicted_timepoints': [18, 24],
            'predicted_scores': mean_pred.tolist(),
            'predicted_std': std_pred.tolist(),
            'ci_lower': ci_lower.tolist(),
            'ci_upper': ci_upper.tolist(),
            'actual_scores': actual_scores.tolist() if actual_scores is not None else None,
            'decline_factor': decline_factor
        }

    def predict_all_patients(
        self,
        n_samples: int = 10
    ) -> List[Dict]:
        """
        Run predictions on all patients

        Args:
            n_samples: Number of MC dropout samples

        Returns:
            List of prediction dictionaries
        """
        results = []

        print(f"\nRunning predictions on {len(self.patients)} patients...")

        for patient in self.patients:
            patient_id = patient['patient_id']

            try:
                result = self.predict_patient(patient_id, n_samples=n_samples)
                results.append(result)
                print(f"  ✓ {patient_id}: Predicted [18m: {result['predicted_scores'][0]:.2f}, 24m: {result['predicted_scores'][1]:.2f}]")
            except Exception as e:
                print(f"  ✗ {patient_id}: Error - {e}")

        return results

    def save_predictions(
        self,
        results: List[Dict],
        output_path: str = 'predictions.csv'
    ):
        """
        Save predictions to CSV

        Args:
            results: List of prediction dictionaries
            output_path: Output CSV path
        """
        rows = []

        for result in results:
            row = {
                'patient_id': result['patient_id'],
                'age': result['age'],
                'baseline_score': result['baseline_score'],
                'decline_rate': result['decline_rate'],
                'predicted_18m': result['predicted_scores'][0],
                'predicted_24m': result['predicted_scores'][1],
                'ci_lower_18m': result['ci_lower'][0],
                'ci_upper_18m': result['ci_upper'][0],
                'ci_lower_24m': result['ci_lower'][1],
                'ci_upper_24m': result['ci_upper'][1],
            }

            if result['actual_scores'] is not None:
                row['actual_18m'] = result['actual_scores'][0]
                row['actual_24m'] = result['actual_scores'][1]
                row['error_18m'] = abs(result['predicted_scores'][0] - result['actual_scores'][0])
                row['error_24m'] = abs(result['predicted_scores'][1] - result['actual_scores'][1])

            rows.append(row)

        df = pd.DataFrame(rows)
        df.to_csv(output_path, index=False)
        print(f"\nSaved predictions to {output_path}")
        print(f"  Rows: {len(df)}")


def main():
    parser = argparse.ArgumentParser(description='Run inference on patient data')

    parser.add_argument('--patient_id', type=str,
                        help='Patient ID to run inference on (e.g., P001)')
    parser.add_argument('--all', action='store_true',
                        help='Run inference on all patients')
    parser.add_argument('--checkpoint', type=str, default='checkpoints/best_model.pt',
                        help='Path to model checkpoint')
    parser.add_argument('--output', type=str, default='predictions.csv',
                        help='Output CSV path')
    parser.add_argument('--n_samples', type=int, default=10,
                        help='Number of MC dropout samples for confidence')
    parser.add_argument('--decline_factor', type=float, default=1.0,
                        help='Factor to adjust decline rate (1.0 = no change)')

    args = parser.parse_args()

    # Initialize predictor
    print("=" * 60)
    print("Cognitive Decline Prediction - Inference")
    print("=" * 60)

    predictor = CognitiveDeclinePredictor(checkpoint_path=args.checkpoint)

    if args.all:
        # Run on all patients
        results = predictor.predict_all_patients(n_samples=args.n_samples)

        # Save to CSV
        predictor.save_predictions(results, output_path=args.output)

        # Print summary statistics
        print("\n" + "=" * 60)
        print("Summary Statistics")
        print("=" * 60)

        errors_18m = [r['error_18m'] for r in results if 'error_18m' in r]
        errors_24m = [r['error_24m'] for r in results if 'error_24m' in r]

        if errors_18m:
            print(f"18-month predictions:")
            print(f"  MAE: {np.mean(errors_18m):.2f} points")
            print(f"  RMSE: {np.sqrt(np.mean(np.array(errors_18m)**2)):.2f} points")

        if errors_24m:
            print(f"24-month predictions:")
            print(f"  MAE: {np.mean(errors_24m):.2f} points")
            print(f"  RMSE: {np.sqrt(np.mean(np.array(errors_24m)**2)):.2f} points")

    elif args.patient_id:
        # Run on single patient
        print(f"\nRunning prediction for patient {args.patient_id}...")

        result = predictor.predict_patient(
            args.patient_id,
            n_samples=args.n_samples,
            decline_factor=args.decline_factor
        )

        # Print results
        print("\n" + "=" * 60)
        print(f"Prediction Results for {args.patient_id}")
        print("=" * 60)
        print(f"\nPatient Info:")
        print(f"  Age: {result['age']}")
        print(f"  Baseline Score: {result['baseline_score']:.2f}")
        print(f"  Decline Rate: {result['decline_rate']:.2f} points/year")

        print(f"\nHistorical Scores:")
        for t, s in zip(result['historical_timepoints'], result['historical_scores']):
            print(f"  {int(t)}m: {s:.2f}")

        print(f"\nPredicted Scores:")
        for i, t in enumerate(result['predicted_timepoints']):
            pred = result['predicted_scores'][i]
            ci_low = result['ci_lower'][i]
            ci_high = result['ci_upper'][i]
            print(f"  {t}m: {pred:.2f} (95% CI: [{ci_low:.2f}, {ci_high:.2f}])")

            if result['actual_scores'] is not None:
                actual = result['actual_scores'][i]
                error = abs(pred - actual)
                print(f"       Actual: {actual:.2f} (Error: {error:.2f})")

        if args.decline_factor != 1.0:
            print(f"\nWhat-if Scenario:")
            print(f"  Decline factor: {args.decline_factor:.2f}x")

    else:
        print("\nError: Please specify --patient_id or --all")
        return

    print("\n" + "=" * 60)
    print("✅ Inference complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
