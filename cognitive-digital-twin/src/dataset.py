"""
PyTorch Dataset for Patient Timeline Data

Loads embeddings + timelines and returns sequences for training.

Each sample consists of:
- Historical sequence: (audio_emb, stylus_emb, timestamp, score)
- Targets: future scores at 12m and 24m

Dataset structure:
- Uses first 3 timepoints (0m, 6m, 12m) as input
- Predicts scores at 18m and 24m as targets

Usage:
    from dataset import PatientDataset

    dataset = PatientDataset(split='train')
    audio_emb, stylus_emb, timestamps, scores, targets = dataset[0]
"""

import json
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from pathlib import Path
from typing import Tuple, List
import warnings


class PatientDataset(Dataset):
    """
    PyTorch Dataset for patient timeline data

    Returns sequences of (audio_emb, stylus_emb, timestamp, score) for forecasting.
    """

    def __init__(
        self,
        data_dir: str = 'data/synthetic',
        split: str = 'train',
        train_ratio: float = 0.8,
        seq_len: int = 3,
        seed: int = 42
    ):
        """
        Args:
            data_dir: Path to synthetic data directory
            split: 'train' or 'test'
            train_ratio: Ratio of data for training (rest for test)
            seq_len: Number of historical timepoints to use (default: 3)
            seed: Random seed for reproducibility
        """
        self.data_dir = Path(data_dir)
        self.split = split
        self.train_ratio = train_ratio
        self.seq_len = seq_len

        # Load patient metadata and timelines
        self.patients = self._load_patients()
        self.timelines = self._load_timelines()

        # Create train/test split
        self.patient_ids = self._create_split(seed)

        # Build dataset samples
        self.samples = self._build_samples()

        # Compute normalization statistics (only from train split)
        if split == 'train':
            self._compute_normalization_stats()

        print(f"Loaded {len(self.samples)} samples for {split} split")

    def _load_patients(self) -> List[dict]:
        """Load patient metadata"""
        patients_path = self.data_dir / 'patients.json'
        with open(patients_path, 'r') as f:
            patients = json.load(f)
        return patients

    def _load_timelines(self) -> pd.DataFrame:
        """Load cognitive score timelines"""
        timelines_path = self.data_dir / 'timelines.csv'
        df = pd.read_csv(timelines_path)
        return df

    def _create_split(self, seed: int) -> List[str]:
        """
        Create train/test split by patient IDs

        Args:
            seed: Random seed

        Returns:
            List of patient IDs for this split
        """
        np.random.seed(seed)

        all_patient_ids = [p['patient_id'] for p in self.patients]
        n_train = int(len(all_patient_ids) * self.train_ratio)

        # Shuffle and split
        shuffled_ids = np.random.permutation(all_patient_ids)

        if self.split == 'train':
            patient_ids = shuffled_ids[:n_train].tolist()
        else:  # test
            patient_ids = shuffled_ids[n_train:].tolist()

        return patient_ids

    def _build_samples(self) -> List[dict]:
        """
        Build dataset samples from patient timelines

        Each sample contains:
        - patient_id: Patient identifier
        - timepoints: List of timepoint indices for the sequence
        - target_timepoints: List of future timepoints to predict

        Returns:
            List of sample dictionaries
        """
        samples = []

        for patient_id in self.patient_ids:
            # Get patient's timeline
            patient_timeline = self.timelines[
                self.timelines['patient_id'] == patient_id
            ].sort_values('timepoint_months')

            # Get patient metadata
            patient_info = next(
                (p for p in self.patients if p['patient_id'] == patient_id),
                None
            )
            if patient_info is None:
                warnings.warn(f"Patient {patient_id} not found in metadata")
                continue

            # We need at least seq_len + 2 timepoints (input + 2 targets)
            if len(patient_timeline) < self.seq_len + 2:
                warnings.warn(
                    f"Patient {patient_id} has insufficient timepoints: "
                    f"{len(patient_timeline)} < {self.seq_len + 2}"
                )
                continue

            # Create sample: use first seq_len timepoints as input
            # Predict at timepoints seq_len and seq_len+1 (12m and 24m horizons)
            timepoints = patient_timeline['timepoint_months'].values[:self.seq_len]
            scores = patient_timeline['cognitive_score'].values[:self.seq_len]

            # Targets: next 2 timepoints
            target_scores = patient_timeline['cognitive_score'].values[
                self.seq_len:self.seq_len+2
            ]
            target_timepoints = patient_timeline['timepoint_months'].values[
                self.seq_len:self.seq_len+2
            ]

            # Only create sample if we have exactly 2 target points
            if len(target_scores) == 2:
                samples.append({
                    'patient_id': patient_id,
                    'timepoints': timepoints,
                    'scores': scores,
                    'target_scores': target_scores,
                    'target_timepoints': target_timepoints,
                    'age': patient_info['age'],
                    'baseline_score': patient_info['baseline_score'],
                    'typing': patient_timeline['typing_flight_time'].values[:self.seq_len],
                    'gait': patient_timeline['gait_variability'].values[:self.seq_len],
                    'treatment': patient_timeline['treatment'].values[0]  # Take first value (constant)
                })

        return samples

    def _compute_normalization_stats(self):
        """
        Compute normalization statistics from training data
        (This could be used by models for normalization)
        """
        all_scores = []
        all_ages = []
        all_typing = []
        all_gait = []

        for sample in self.samples:
            all_scores.extend(sample['scores'].tolist())
            all_scores.extend(sample['target_scores'].tolist())
            all_ages.append(sample['age'])
            all_typing.extend(sample['typing'].tolist())
            all_gait.extend(sample['gait'].tolist())

        self.score_mean = np.mean(all_scores)
        self.score_std = np.std(all_scores)
        self.age_mean = np.mean(all_ages)
        self.age_std = np.std(all_ages)
        self.typing_mean = np.mean(all_typing)
        self.typing_std = np.std(all_typing)
        self.gait_mean = np.mean(all_gait)
        self.gait_std = np.std(all_gait)

        print(f"  Score: mean={self.score_mean:.2f}, std={self.score_std:.2f}")
        print(f"  Age: mean={self.age_mean:.2f}, std={self.age_std:.2f}")
        print(f"  Typing: mean={self.typing_mean:.2f}, std={self.typing_std:.2f}")
        print(f"  Gait: mean={self.gait_mean:.4f}, std={self.gait_std:.4f}")

    def _load_embedding(self, embedding_path: Path) -> np.ndarray:
        """
        Load embedding from file

        Args:
            embedding_path: Path to .npy embedding file

        Returns:
            Embedding array
        """
        if not embedding_path.exists():
            raise FileNotFoundError(f"Embedding not found: {embedding_path}")

        emb = np.load(embedding_path)
        return emb

    def __len__(self) -> int:
        """Return number of samples"""
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, ...]:
        """
        Get a single sample

        Args:
            idx: Sample index

        Returns:
            Tuple of:
            - audio_embeddings: (seq_len, audio_dim)
            - stylus_embeddings: (seq_len, stylus_dim)
            - timestamps: (seq_len,)
            - scores: (seq_len,)
            - targets: (2,) - scores at 18m and 24m
            - age: scalar
            - baseline_score: scalar
            - typing: (seq_len,)
            - gait: (seq_len,)
            - treatment: scalar
        """
        sample = self.samples[idx]

        patient_id = sample['patient_id']
        timepoints = sample['timepoints']
        scores = sample['scores']
        target_scores = sample['target_scores']
        age = sample['age']
        baseline_score = sample['baseline_score']
        typing = sample['typing']
        gait = sample['gait']
        treatment = sample['treatment']

        # Load embeddings for each timepoint in the sequence
        audio_embeddings = []
        stylus_embeddings = []

        for t in timepoints:
            # Audio embedding: same for all timepoints (MVP limitation)
            audio_path = self.data_dir / 'audio_embeddings' / f'{patient_id}_T{int(t):02d}.npy'
            audio_emb = self._load_embedding(audio_path)
            audio_embeddings.append(audio_emb)

            # Stylus embedding: may have multiple traces per timepoint
            # For now, use the first trace at each timepoint
            stylus_pattern = f'{patient_id}_T{int(t):02d}_1.npy'
            stylus_path = self.data_dir / 'stylus_embeddings' / stylus_pattern

            # Fallback if first trace doesn't exist
            if not stylus_path.exists():
                # Try to find any trace for this timepoint
                stylus_dir = self.data_dir / 'stylus_embeddings'
                alternatives = list(stylus_dir.glob(f'{patient_id}_T{int(t):02d}_*.npy'))
                if alternatives:
                    stylus_path = alternatives[0]
                else:
                    raise FileNotFoundError(
                        f"No stylus embedding found for {patient_id} at T{int(t):02d}"
                    )

            stylus_emb = self._load_embedding(stylus_path)
            stylus_embeddings.append(stylus_emb)

        # Convert to tensors
        audio_embeddings = torch.tensor(np.stack(audio_embeddings), dtype=torch.float32)
        stylus_embeddings = torch.tensor(np.stack(stylus_embeddings), dtype=torch.float32)
        timestamps = torch.tensor(timepoints, dtype=torch.float32)
        scores = torch.tensor(scores, dtype=torch.float32)
        targets = torch.tensor(target_scores, dtype=torch.float32)
        age = torch.tensor(age, dtype=torch.float32)
        baseline_score = torch.tensor(baseline_score, dtype=torch.float32)
        typing = torch.tensor(typing, dtype=torch.float32)
        gait = torch.tensor(gait, dtype=torch.float32)
        treatment = torch.tensor(treatment, dtype=torch.float32)

        return (
            audio_embeddings,
            stylus_embeddings,
            timestamps,
            scores,
            targets,
            age,
            baseline_score,
            typing,
            gait,
            treatment
        )


def test_dataset():
    """
    Test dataset loading and iteration
    """
    print("=" * 60)
    print("Testing PatientDataset")
    print("=" * 60)

    # Create train and test datasets
    print("\nCreating datasets...")
    train_dataset = PatientDataset(split='train', seq_len=3)
    test_dataset = PatientDataset(split='test', seq_len=3)

    print(f"\nTrain samples: {len(train_dataset)}")
    print(f"Test samples: {len(test_dataset)}")

    # Test loading a sample
    print("\n[1] Testing sample loading...")
    sample = train_dataset[0]
    audio_emb, stylus_emb, timestamps, scores, targets, age, baseline, typing, gait, treatment = sample

    print(f"  Audio embeddings: {audio_emb.shape}")
    print(f"  Stylus embeddings: {stylus_emb.shape}")
    print(f"  Timestamps: {timestamps.shape} = {timestamps.tolist()}")
    print(f"  Scores: {scores.shape} = {[f'{s:.2f}' for s in scores.tolist()]}")
    print(f"  Targets: {targets.shape} = {[f'{t:.2f}' for t in targets.tolist()]}")
    print(f"  Age: {age.item():.0f}")
    print(f"  Baseline: {baseline.item():.2f}")
    print(f"  Typing: {typing.shape}")
    print(f"  Gait: {gait.shape}")
    print(f"  Treatment: {treatment.item()}")

    # Test batch loading with DataLoader
    print("\n[2] Testing DataLoader...")
    from torch.utils.data import DataLoader

    train_loader = DataLoader(
        train_dataset,
        batch_size=4,
        shuffle=True,
        num_workers=0
    )

    batch = next(iter(train_loader))
    audio_batch, stylus_batch, ts_batch, score_batch, target_batch, age_batch, base_batch, typing_batch, gait_batch, treat_batch = batch

    print(f"  Batch audio embeddings: {audio_batch.shape}")
    print(f"  Batch stylus embeddings: {stylus_batch.shape}")
    print(f"  Batch timestamps: {ts_batch.shape}")
    print(f"  Batch scores: {score_batch.shape}")
    print(f"  Batch targets: {target_batch.shape}")
    print(f"  Batch ages: {age_batch.shape}")
    print(f"  Batch baselines: {base_batch.shape}")
    print(f"  Batch typing: {typing_batch.shape}")
    print(f"  Batch gait: {gait_batch.shape}")
    print(f"  Batch treatment: {treat_batch.shape}")

    # Verify data ranges
    print("\n[3] Data range checks...")
    print(f"  Audio embedding range: [{audio_batch.min():.3f}, {audio_batch.max():.3f}]")
    print(f"  Stylus embedding range: [{stylus_batch.min():.3f}, {stylus_batch.max():.3f}]")
    print(f"  Timestamp range: [{ts_batch.min():.1f}, {ts_batch.max():.1f}] months")
    print(f"  Score range: [{score_batch.min():.2f}, {score_batch.max():.2f}]")
    print(f"  Target range: [{target_batch.min():.2f}, {target_batch.max():.2f}]")
    print(f"  Age range: [{age_batch.min():.0f}, {age_batch.max():.0f}]")

    print("\n" + "=" * 60)
    print("✅ Dataset tests passed!")
    print("=" * 60)


if __name__ == '__main__':
    test_dataset()
