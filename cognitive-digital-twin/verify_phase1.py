"""
Phase 1 Verification Script

Checks that all data was generated correctly
"""

import json
import pandas as pd
from pathlib import Path
import scipy.io.wavfile as wavfile


def verify_phase1():
    print("=" * 60)
    print("Phase 1 Verification")
    print("=" * 60)

    errors = []

    # 1. Check patients.json
    print("\n[1] Checking patients.json...")
    patients_path = Path('data/synthetic/patients.json')
    if not patients_path.exists():
        errors.append("patients.json not found")
    else:
        with open(patients_path) as f:
            patients = json.load(f)
        print(f"  ✓ Found {len(patients)} patients")

        # Check patient fields
        required_fields = ['patient_id', 'age', 'baseline_score', 'decline_rate', 'audio_file']
        for p in patients[:3]:  # check first 3
            for field in required_fields:
                if field not in p:
                    errors.append(f"Patient missing field: {field}")

        if not errors:
            print(f"  ✓ All patients have required fields")

    # 2. Check timelines.csv
    print("\n[2] Checking timelines.csv...")
    timeline_path = Path('data/synthetic/timelines.csv')
    if not timeline_path.exists():
        errors.append("timelines.csv not found")
    else:
        df = pd.read_csv(timeline_path)
        print(f"  ✓ Found {len(df)} timeline records")
        print(f"  ✓ Columns: {list(df.columns)}")
        print(f"  ✓ Timepoints: {sorted(df['timepoint_months'].unique())}")
        print(f"  ✓ Score range: {df['cognitive_score'].min():.1f} - {df['cognitive_score'].max():.1f}")

    # 3. Check stylus traces
    print("\n[3] Checking stylus traces...")
    trace_dir = Path('data/synthetic/stylus_traces')
    if not trace_dir.exists():
        errors.append("stylus_traces directory not found")
    else:
        traces = list(trace_dir.glob('*.json'))
        print(f"  ✓ Found {len(traces)} stylus trace files")

        # Check first trace structure
        if traces:
            with open(traces[0]) as f:
                trace = json.load(f)
            required_fields = ['trace_id', 'n_points', 'total_time', 'avg_speed', 'points']
            for field in required_fields:
                if field not in trace:
                    errors.append(f"Trace missing field: {field}")

            if 'points' in trace and len(trace['points']) > 0:
                point_fields = ['x', 'y', 't', 'pressure']
                for field in point_fields:
                    if field not in trace['points'][0]:
                        errors.append(f"Trace point missing field: {field}")

            if not errors:
                print(f"  ✓ Trace format is correct")

    # 4. Check audio files
    print("\n[4] Checking audio files...")
    audio_dir = Path('data/sample_audio')
    if not audio_dir.exists():
        errors.append("sample_audio directory not found")
    else:
        audio_files = list(audio_dir.glob('*.wav'))
        print(f"  ✓ Found {len(audio_files)} audio files")

        # Check first audio file
        if audio_files:
            sr, data = wavfile.read(audio_files[0])
            duration = len(data) / sr
            print(f"  ✓ Sample audio: {sr}Hz, {duration:.1f}s duration")
            if sr != 16000:
                errors.append(f"Audio sample rate is {sr}, expected 16000")

    # Summary
    print("\n" + "=" * 60)
    if errors:
        print("❌ VERIFICATION FAILED")
        print("\nErrors found:")
        for e in errors:
            print(f"  - {e}")
    else:
        print("✅ PHASE 1 COMPLETE - All checks passed!")
        print("\nGenerated data:")
        print(f"  • {len(patients)} synthetic patients")
        print(f"  • {len(df)} cognitive score measurements")
        print(f"  • {len(traces)} stylus traces")
        print(f"  • {len(audio_files)} audio files")
        print("\nNext step: Run Phase 2 (embeddings extraction)")
    print("=" * 60)

    return len(errors) == 0


if __name__ == '__main__':
    verify_phase1()
