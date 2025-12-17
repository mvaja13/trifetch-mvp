"""
Synthetic Data Generator for Linus ML Twin MVP

Generates:
- Patient demographics and baseline info
- Cognitive score timelines (0, 6, 12, 18, 24 months)
- Stylus traces simulating handwriting/drawing tasks
- Sample audio file assignments

Usage:
    python src/data_gen.py
"""

import argparse
import json
import numpy as np
import pandas as pd
from pathlib import Path
import random


def generate_cognitive_timeline(patient_id, baseline_score, decline_rate, treatment, n_timepoints=5):
    """
    Generate cognitive score timeline with decline + noise, plus passive biomarkers.

    Args:
        patient_id: Unique patient identifier
        baseline_score: Initial cognitive score (90-100)
        decline_rate: Points lost per year (0-6)
        treatment: Binary flag (0 or 1) indicating if patient is treated
        n_timepoints: Number of measurement points

    Returns:
        List of dicts with timepoint data
    """
    timepoints = [0, 6, 12, 18, 24]  # months
    timeline = []

    # Treatment effect: Reduces decline rate by 50%
    effective_decline_rate = decline_rate * 0.5 if treatment == 1 else decline_rate

    for t in timepoints:
        # Calculate expected score with decline
        years_elapsed = t / 12.0
        expected_score = baseline_score - (effective_decline_rate * years_elapsed)

        # Add Gaussian noise (std = 2 points)
        actual_score = expected_score + np.random.normal(0, 2.0)

        # Clip to valid range [0, 100]
        actual_score = np.clip(actual_score, 0, 100)
        actual_score = round(actual_score, 2)

        # Generate Passive Biomarkers based on Score
        # 1. Typing Flight Time (ms): Baseline 120ms + (1 - score/100)*130
        # Lower score -> Higher flight time (slower typing)
        flight_noise = np.random.normal(0, 5.0) # 5ms noise
        typing_flight_time = 120 + (1.0 - actual_score/100.0) * 130 + flight_noise
        typing_flight_time = float(np.clip(typing_flight_time, 50, 500))

        # 2. Gait Variability (ms^2): Baseline 0.05 + (1 - score/100)*0.2
        # Lower score -> Higher variability
        gait_noise = np.random.normal(0, 0.005)
        gait_variability = 0.05 + (1.0 - actual_score/100.0) * 0.2 + gait_noise
        gait_variability = float(np.clip(gait_variability, 0.0, 1.0))

        timeline.append({
            'patient_id': patient_id,
            'timepoint_months': t,
            'cognitive_score': actual_score,
            'treatment': int(treatment),
            'typing_flight_time': round(typing_flight_time, 2),
            'gait_variability': round(gait_variability, 4)
        })

    return timeline


def generate_stylus_trace(decline_factor, trace_id):
    """
    Generate synthetic stylus trace (handwriting/drawing task)

    Args:
        decline_factor: 0-1 scale, higher = more cognitive decline
        trace_id: Unique trace identifier

    Returns:
        Dict with stroke points and metadata
    """
    # Base parameters
    n_points = random.randint(50, 150)
    base_speed = 100  # pixels per second
    base_pressure = 0.7

    # Adjust parameters based on decline
    # More decline -> slower, more hesitation, lower pressure
    speed_factor = 1.0 - (decline_factor * 0.5)
    hesitation_prob = decline_factor * 0.3  # probability of pause
    pressure_factor = 1.0 - (decline_factor * 0.3)

    points = []
    t = 0.0
    x, y = 50.0, 50.0  # start position

    for i in range(n_points):
        # Random walk with some structure
        angle = np.random.uniform(0, 2 * np.pi)
        step_size = np.random.uniform(2, 8) * speed_factor

        x += np.cos(angle) * step_size
        y += np.sin(angle) * step_size

        # Add hesitation (longer time gaps)
        if np.random.random() < hesitation_prob:
            dt = np.random.uniform(0.2, 0.5)  # long pause
        else:
            dt = step_size / (base_speed * speed_factor)

        t += dt

        # Pressure varies with decline
        pressure = base_pressure * pressure_factor + np.random.normal(0, 0.1)
        pressure = np.clip(pressure, 0.1, 1.0)

        points.append({
            'x': round(x, 2),
            'y': round(y, 2),
            't': round(t, 3),
            'pressure': round(pressure, 3)
        })

    # Calculate summary stats
    speeds = []
    for i in range(1, len(points)):
        dx = points[i]['x'] - points[i-1]['x']
        dy = points[i]['y'] - points[i-1]['y']
        dt = points[i]['t'] - points[i-1]['t']
        if dt > 0:
            speed = np.sqrt(dx**2 + dy**2) / dt
            speeds.append(speed)

    return {
        'trace_id': trace_id,
        'n_points': n_points,
        'total_time': round(t, 3),
        'avg_speed': round(np.mean(speeds) if speeds else 0, 2),
        'std_speed': round(np.std(speeds) if speeds else 0, 2),
        'avg_pressure': round(np.mean([p['pressure'] for p in points]), 3),
        'points': points
    }


def generate_patient_data(n_patients=200):
    """
    Generate synthetic patient cohort

    Args:
        n_patients: Number of synthetic patients to generate

    Returns:
        patients: List of patient dicts
        all_timelines: List of timeline dicts
    """
    patients = []
    all_timelines = []

    # Sample audio files to assign (we'll reference 5 demo files)
    audio_files = [f'sample_{i:02d}.wav' for i in range(5)]

    for i in range(n_patients):
        patient_id = f'P{i+1:03d}'

        # Generate patient attributes
        age = random.randint(65, 85)
        baseline_score = random.uniform(90, 100)
        decline_rate = random.uniform(0, 6)  # points per year

        # Assign audio file (rotate through available files)
        audio_file = audio_files[i % len(audio_files)]

        # Assign treatment (50% probability)
        treatment = 1 if random.random() > 0.5 else 0

        patient = {
            'patient_id': patient_id,
            'age': age,
            'baseline_score': round(baseline_score, 2),
            'decline_rate': round(decline_rate, 2),
            'audio_file': audio_file,
            'treatment': treatment
        }
        patients.append(patient)

        # Generate timeline
        timeline = generate_cognitive_timeline(
            patient_id, baseline_score, decline_rate, treatment
        )
        all_timelines.extend(timeline)

        # Generate stylus traces for each timepoint
        timepoints = [0, 6, 12, 18, 24]
        for j, t in enumerate(timepoints):
            # Calculate decline factor at this timepoint
            years_elapsed = t / 12.0
            decline_factor = min((decline_rate * years_elapsed) / 20.0, 1.0)

            # Generate 1-3 traces per timepoint
            n_traces = random.randint(1, 3)
            for k in range(n_traces):
                trace_id = f'{patient_id}_T{t:02d}_{k+1}'
                trace = generate_stylus_trace(decline_factor, trace_id)

                # Save trace to JSON
                trace_path = Path('data/synthetic/stylus_traces') / f'{trace_id}.json'
                with open(trace_path, 'w') as f:
                    json.dump(trace, f, indent=2)

    return patients, all_timelines


def create_sample_audio_files():
    """
    Create placeholder audio files using simple sine wave tones

    In a real implementation, you would:
    - Use TTS (e.g., pyttsx3, gTTS)
    - Copy LibriSpeech samples
    - Record actual speech samples

    For this MVP, we create silent/simple audio as placeholders
    """
    try:
        import scipy.io.wavfile as wavfile
    except ImportError:
        print("scipy not available, skipping audio generation")
        print("Audio files should be manually added to data/sample_audio/")
        return

    sample_rate = 16000  # 16kHz (wav2vec2 standard)
    audio_dir = Path('data/sample_audio')

    for i in range(5):
        duration = random.uniform(6, 20)  # 6-20 seconds
        n_samples = int(sample_rate * duration)

        # Generate simple tone (placeholder for speech)
        # In real version, this would be actual speech
        freq = 200 + i * 50  # varying frequency per file
        t = np.linspace(0, duration, n_samples)
        audio = (0.3 * np.sin(2 * np.pi * freq * t)).astype(np.float32)

        # Add some noise to make it more realistic
        audio += 0.1 * np.random.randn(n_samples).astype(np.float32)

        # Convert to int16 for WAV
        audio_int16 = (audio * 32767).astype(np.int16)

        # Save
        filename = audio_dir / f'sample_{i:02d}.wav'
        wavfile.write(filename, sample_rate, audio_int16)
        print(f"Created {filename} ({duration:.1f}s)")


def main():
    """
    Main execution: generate all synthetic data
    """
    print("=" * 60)
    print("Linus ML Twin - Synthetic Data Generator")
    print("=" * 60)

    # Set random seed for reproducibility
    np.random.seed(42)
    random.seed(42)

    parser = argparse.ArgumentParser(description='Generate synthetic patient data')
    parser.add_argument('--num_patients', type=int, default=20, help='Number of patients to generate')
    args = parser.parse_args()

    # Generate patient data
    print("\n[1/4] Generating patient cohort...")
    patients, timelines = generate_patient_data(n_patients=args.num_patients)
    print(f"  ✓ Generated {len(patients)} patients")
    print(f"  ✓ Generated {len(timelines)} timeline points")

    # Save patients to JSON
    print("\n[2/4] Saving patient data...")
    patients_path = Path('data/synthetic/patients.json')
    with open(patients_path, 'w') as f:
        json.dump(patients, f, indent=2)
    print(f"  ✓ Saved to {patients_path}")

    # Save timelines to CSV
    print("\n[3/4] Saving cognitive timelines...")
    df = pd.DataFrame(timelines)
    timeline_path = Path('data/synthetic/timelines.csv')
    df.to_csv(timeline_path, index=False)
    print(f"  ✓ Saved to {timeline_path}")

    # Count stylus traces
    trace_dir = Path('data/synthetic/stylus_traces')
    n_traces = len(list(trace_dir.glob('*.json')))
    print(f"  ✓ Saved {n_traces} stylus traces to {trace_dir}/")

    # Generate sample audio
    print("\n[4/4] Generating sample audio files...")
    create_sample_audio_files()

    # Summary
    print("\n" + "=" * 60)
    print("Data Generation Complete!")
    print("=" * 60)
    print(f"Patients:        {len(patients)}")
    print(f"Timeline points: {len(timelines)}")
    print(f"Stylus traces:   {n_traces}")
    print(f"Audio files:     5 (in data/sample_audio/)")
    print("\nNext step: Run Phase 2 (embeddings extraction)")
    print("=" * 60)


if __name__ == '__main__':
    main()
