"""
Batch Embedding Generation Script

Processes all synthetic patients and generates:
- Audio embeddings (wav2vec2)
- Stylus embeddings (handcrafted features + MLP)

Saves embeddings as .npy files for training.

Usage:
    python src/generate_embeddings.py
"""

import json
import numpy as np
from pathlib import Path
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

from audio_embed import AudioEmbedder
from stylus_embed import StylusEmbedder


def load_patients():
    """Load patient metadata"""
    with open('data/synthetic/patients.json', 'r') as f:
        patients = json.load(f)
    return patients


def generate_audio_embeddings(patients, audio_embedder):
    """
    Generate audio embeddings for all patients

    Args:
        patients: List of patient dicts
        audio_embedder: Pre-loaded AudioEmbedder instance

    Returns:
        count: Number of embeddings generated
    """
    print("\n[1/2] Generating audio embeddings...")

    output_dir = Path('data/synthetic/audio_embeddings')
    output_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for patient in tqdm(patients, desc="Audio embeddings"):
        patient_id = patient['patient_id']
        audio_file = patient['audio_file']
        audio_path = Path('data/sample_audio') / audio_file

        if not audio_path.exists():
            print(f"\n  Warning: Audio file not found: {audio_path}")
            continue

        # Generate embeddings for each timepoint
        # (same audio file used for all timepoints in this MVP)
        timepoints = [0, 6, 12, 18, 24]

        for t in timepoints:
            output_path = output_dir / f'{patient_id}_T{t:02d}.npy'

            # Skip if already exists
            if output_path.exists():
                continue

            # Extract and save
            try:
                embedding = audio_embedder.save_embedding(audio_path, output_path)
                count += 1
            except Exception as e:
                print(f"\n  Error processing {audio_path}: {e}")

    return count


def generate_stylus_embeddings(stylus_embedder):
    """
    Generate stylus embeddings for all traces

    Args:
        stylus_embedder: Pre-loaded StylusEmbedder instance

    Returns:
        count: Number of embeddings generated
    """
    print("\n[2/2] Generating stylus embeddings...")

    trace_dir = Path('data/synthetic/stylus_traces')
    output_dir = Path('data/synthetic/stylus_embeddings')
    output_dir.mkdir(parents=True, exist_ok=True)

    # Get all trace files
    trace_files = sorted(trace_dir.glob('*.json'))

    count = 0
    for trace_path in tqdm(trace_files, desc="Stylus embeddings"):
        # Output path: same name but .npy extension
        output_path = output_dir / f'{trace_path.stem}.npy'

        # Skip if already exists
        if output_path.exists():
            continue

        # Extract and save
        try:
            embedding = stylus_embedder.save_embedding(trace_path, output_path)
            count += 1
        except Exception as e:
            print(f"\n  Error processing {trace_path}: {e}")

    return count


def verify_embeddings():
    """
    Verify that embeddings were generated correctly
    """
    print("\n" + "=" * 60)
    print("Verifying embeddings...")
    print("=" * 60)

    # Check audio embeddings
    audio_dir = Path('data/synthetic/audio_embeddings')
    audio_embeddings = list(audio_dir.glob('*.npy'))

    print(f"\nAudio embeddings: {len(audio_embeddings)} files")

    if audio_embeddings:
        # Check first embedding
        emb = np.load(audio_embeddings[0])
        print(f"  Shape: {emb.shape}")
        print(f"  Dtype: {emb.dtype}")
        print(f"  Range: [{emb.min():.3f}, {emb.max():.3f}]")

        # Check all shapes are consistent
        shapes = [np.load(f).shape for f in audio_embeddings[:10]]
        if len(set(shapes)) == 1:
            print(f"  ✓ All embeddings have consistent shape")
        else:
            print(f"  ✗ Warning: Inconsistent shapes detected")

    # Check stylus embeddings
    stylus_dir = Path('data/synthetic/stylus_embeddings')
    stylus_embeddings = list(stylus_dir.glob('*.npy'))

    print(f"\nStylus embeddings: {len(stylus_embeddings)} files")

    if stylus_embeddings:
        # Check first embedding
        emb = np.load(stylus_embeddings[0])
        print(f"  Shape: {emb.shape}")
        print(f"  Dtype: {emb.dtype}")
        print(f"  Range: [{emb.min():.3f}, {emb.max():.3f}]")

        # Check all shapes are consistent
        shapes = [np.load(f).shape for f in stylus_embeddings[:10]]
        if len(set(shapes)) == 1:
            print(f"  ✓ All embeddings have consistent shape")
        else:
            print(f"  ✗ Warning: Inconsistent shapes detected")

    print("=" * 60)


def main():
    """
    Main execution: generate all embeddings
    """
    print("=" * 60)
    print("Linus ML Twin - Embedding Generation")
    print("=" * 60)

    # Load patient data
    patients = load_patients()
    print(f"\nLoaded {len(patients)} patients")

    # Initialize embedders
    print("\nInitializing models...")
    print("-" * 60)

    audio_embedder = AudioEmbedder(target_dim=128)
    stylus_embedder = StylusEmbedder(input_dim=10, hidden_dim=64, output_dim=128)
    stylus_embedder.eval()

    print("-" * 60)

    # Generate audio embeddings
    audio_count = generate_audio_embeddings(patients, audio_embedder)
    print(f"  ✓ Generated {audio_count} new audio embeddings")

    # Generate stylus embeddings
    stylus_count = generate_stylus_embeddings(stylus_embedder)
    print(f"  ✓ Generated {stylus_count} new stylus embeddings")

    # Verify
    verify_embeddings()

    print("\n✅ Embedding generation complete!")
    print("\nNext step: Run Phase 3 (fusion & forecast models)")
    print("=" * 60)


if __name__ == '__main__':
    main()
