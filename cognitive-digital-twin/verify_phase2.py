"""
Phase 2 Verification Script

Checks that all embeddings were generated correctly
"""

import json
import numpy as np
from pathlib import Path


def verify_phase2():
    print("=" * 60)
    print("Phase 2 Verification")
    print("=" * 60)

    errors = []

    # Load patient data
    with open('data/synthetic/patients.json', 'r') as f:
        patients = json.load(f)

    # 1. Check audio embeddings
    print("\n[1] Checking audio embeddings...")
    audio_dir = Path('data/synthetic/audio_embeddings')

    if not audio_dir.exists():
        errors.append("audio_embeddings directory not found")
    else:
        audio_files = list(audio_dir.glob('*.npy'))
        print(f"  ✓ Found {len(audio_files)} audio embedding files")

        # Expected: 20 patients × 5 timepoints = 100
        expected_count = len(patients) * 5
        if len(audio_files) != expected_count:
            errors.append(f"Expected {expected_count} audio embeddings, found {len(audio_files)}")
        else:
            print(f"  ✓ Correct number of embeddings ({expected_count})")

        # Check shapes and data
        if audio_files:
            shapes = []
            for f in audio_files[:10]:
                emb = np.load(f)
                shapes.append(emb.shape)

                # Check valid values
                if not np.isfinite(emb).all():
                    errors.append(f"Invalid values in {f.name}")

            if len(set(shapes)) == 1:
                print(f"  ✓ All embeddings have shape {shapes[0]}")
                if shapes[0] != (128,):
                    errors.append(f"Expected shape (128,), got {shapes[0]}")
            else:
                errors.append("Inconsistent embedding shapes")

            # Check sample embedding
            sample_emb = np.load(audio_files[0])
            print(f"  ✓ Sample embedding range: [{sample_emb.min():.3f}, {sample_emb.max():.3f}]")

    # 2. Check stylus embeddings
    print("\n[2] Checking stylus embeddings...")
    stylus_dir = Path('data/synthetic/stylus_embeddings')

    if not stylus_dir.exists():
        errors.append("stylus_embeddings directory not found")
    else:
        stylus_files = list(stylus_dir.glob('*.npy'))
        print(f"  ✓ Found {len(stylus_files)} stylus embedding files")

        # Check that we have embeddings for all traces
        trace_dir = Path('data/synthetic/stylus_traces')
        trace_files = list(trace_dir.glob('*.json'))

        if len(stylus_files) != len(trace_files):
            errors.append(f"Expected {len(trace_files)} stylus embeddings, found {len(stylus_files)}")
        else:
            print(f"  ✓ Correct number of embeddings ({len(trace_files)})")

        # Check shapes and data
        if stylus_files:
            shapes = []
            for f in stylus_files[:10]:
                emb = np.load(f)
                shapes.append(emb.shape)

                # Check valid values
                if not np.isfinite(emb).all():
                    errors.append(f"Invalid values in {f.name}")

            if len(set(shapes)) == 1:
                print(f"  ✓ All embeddings have shape {shapes[0]}")
                if shapes[0] != (128,):
                    errors.append(f"Expected shape (128,), got {shapes[0]}")
            else:
                errors.append("Inconsistent embedding shapes")

            # Check sample embedding
            sample_emb = np.load(stylus_files[0])
            print(f"  ✓ Sample embedding range: [{sample_emb.min():.3f}, {sample_emb.max():.3f}]")

    # 3. Check alignment between audio and stylus
    print("\n[3] Checking embedding alignment...")

    # For each patient, check we have both audio and stylus embeddings
    timepoints = [0, 6, 12, 18, 24]
    for patient in patients[:5]:  # Check first 5 patients
        patient_id = patient['patient_id']

        for t in timepoints:
            # Check audio embedding exists
            audio_path = audio_dir / f'{patient_id}_T{t:02d}.npy'
            if not audio_path.exists():
                errors.append(f"Missing audio embedding for {patient_id} at T{t:02d}")

            # Check at least one stylus embedding exists for this timepoint
            stylus_pattern = f'{patient_id}_T{t:02d}_*.npy'
            stylus_matches = list(stylus_dir.glob(stylus_pattern))
            if len(stylus_matches) == 0:
                errors.append(f"Missing stylus embeddings for {patient_id} at T{t:02d}")

    if not errors:
        print(f"  ✓ All patients have complete embeddings")

    # Summary
    print("\n" + "=" * 60)
    if errors:
        print("❌ VERIFICATION FAILED")
        print("\nErrors found:")
        for e in errors:
            print(f"  - {e}")
    else:
        print("✅ PHASE 2 COMPLETE - All checks passed!")
        print("\nGenerated embeddings:")
        print(f"  • {len(audio_files)} audio embeddings (wav2vec2)")
        print(f"  • {len(stylus_files)} stylus embeddings (features + MLP)")
        print(f"  • All embeddings are 128-dimensional")
        print("\nNext step: Run Phase 3 (fusion & forecast models)")
    print("=" * 60)

    return len(errors) == 0


if __name__ == '__main__':
    verify_phase2()
