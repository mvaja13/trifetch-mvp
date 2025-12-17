"""
Stylus Embedding Extractor

Extracts handcrafted features from stylus traces and maps to fixed-size embeddings.

Features extracted:
- avg_speed: Average stroke speed
- std_speed: Speed variability
- total_time: Total drawing time
- avg_pressure: Average pen pressure
- hesitation_count: Number of pauses (dt > threshold)
- stroke_smoothness: Curvature-based smoothness metric

Dependencies:
    pip install torch numpy

Usage:
    from stylus_embed import extract_stylus_embedding

    embedding = extract_stylus_embedding('path/to/trace.json')
    # Returns: numpy array of shape (128,)

Example:
    python src/stylus_embed.py data/synthetic/stylus_traces/P001_T00_1.json
"""

import json
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path


class StylusFeatureExtractor:
    """
    Extract handcrafted features from stylus trace
    """

    def __init__(self, hesitation_threshold=0.1):
        """
        Args:
            hesitation_threshold: Time gap (seconds) to count as hesitation
        """
        self.hesitation_threshold = hesitation_threshold

    def load_trace(self, trace_path):
        """
        Load stylus trace from JSON file

        Args:
            trace_path: Path to trace JSON file

        Returns:
            trace: Dict with trace data and points
        """
        with open(trace_path, 'r') as f:
            trace = json.load(f)
        return trace

    def extract_features(self, trace):
        """
        Extract handcrafted features from trace

        Args:
            trace: Dict with 'points' list (each point has x, y, t, pressure)

        Returns:
            features: Dict of feature name -> value
        """
        points = trace['points']
        n_points = len(points)

        if n_points < 2:
            # Not enough points
            return self._get_default_features()

        # Extract arrays
        x = np.array([p['x'] for p in points])
        y = np.array([p['y'] for p in points])
        t = np.array([p['t'] for p in points])
        pressure = np.array([p['pressure'] for p in points])

        # 1. Speed features
        dx = np.diff(x)
        dy = np.diff(y)
        dt = np.diff(t)

        # Avoid division by zero
        dt = np.maximum(dt, 1e-6)

        speeds = np.sqrt(dx**2 + dy**2) / dt
        avg_speed = np.mean(speeds)
        std_speed = np.std(speeds)

        # 2. Total time
        total_time = t[-1] - t[0]

        # 3. Average pressure
        avg_pressure = np.mean(pressure)
        std_pressure = np.std(pressure)

        # 4. Hesitation count (long pauses)
        hesitations = np.sum(dt > self.hesitation_threshold)

        # 5. Stroke smoothness (based on curvature)
        # Calculate angles between consecutive segments
        if n_points > 2:
            angles = []
            for i in range(len(dx) - 1):
                v1 = np.array([dx[i], dy[i]])
                v2 = np.array([dx[i+1], dy[i+1]])

                # Angle between vectors
                cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
                cos_angle = np.clip(cos_angle, -1, 1)
                angle = np.arccos(cos_angle)
                angles.append(angle)

            # Smoothness: lower angle variance = smoother
            stroke_smoothness = 1.0 / (1.0 + np.std(angles))
        else:
            stroke_smoothness = 1.0

        # 6. Additional features
        path_length = np.sum(np.sqrt(dx**2 + dy**2))
        spatial_extent = np.sqrt((x.max() - x.min())**2 + (y.max() - y.min())**2)

        features = {
            'avg_speed': avg_speed,
            'std_speed': std_speed,
            'total_time': total_time,
            'avg_pressure': avg_pressure,
            'std_pressure': std_pressure,
            'hesitation_count': hesitations,
            'stroke_smoothness': stroke_smoothness,
            'path_length': path_length,
            'spatial_extent': spatial_extent,
            'n_points': n_points
        }

        return features

    def _get_default_features(self):
        """Return default features for empty/invalid traces"""
        return {
            'avg_speed': 0.0,
            'std_speed': 0.0,
            'total_time': 0.0,
            'avg_pressure': 0.0,
            'std_pressure': 0.0,
            'hesitation_count': 0,
            'stroke_smoothness': 0.0,
            'path_length': 0.0,
            'spatial_extent': 0.0,
            'n_points': 0
        }


class StylusEmbedder(nn.Module):
    """
    Neural network to map handcrafted features to embeddings
    """

    def __init__(self, input_dim=10, hidden_dim=64, output_dim=128):
        """
        Args:
            input_dim: Number of input features
            hidden_dim: Hidden layer size
            output_dim: Embedding dimension
        """
        super().__init__()

        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, output_dim),
            nn.Tanh()  # Normalize to [-1, 1]
        )

        self.feature_extractor = StylusFeatureExtractor()

        # Feature normalization stats (will be set during training)
        # For now, use reasonable defaults
        self.feature_names = [
            'avg_speed', 'std_speed', 'total_time', 'avg_pressure',
            'std_pressure', 'hesitation_count', 'stroke_smoothness',
            'path_length', 'spatial_extent', 'n_points'
        ]

        # Default normalization (mean=0, std=1 range)
        self.register_buffer('feature_mean', torch.zeros(input_dim))
        self.register_buffer('feature_std', torch.ones(input_dim))

    def features_to_tensor(self, features):
        """
        Convert feature dict to normalized tensor

        Args:
            features: Dict of feature values

        Returns:
            tensor: Normalized feature tensor
        """
        # Extract features in order
        values = [features[name] for name in self.feature_names]
        tensor = torch.tensor(values, dtype=torch.float32)

        # Normalize
        tensor = (tensor - self.feature_mean) / (self.feature_std + 1e-6)

        return tensor

    def forward(self, features_tensor):
        """
        Forward pass

        Args:
            features_tensor: Tensor of shape (batch, input_dim) or (input_dim,)

        Returns:
            embeddings: Tensor of shape (batch, output_dim) or (output_dim,)
        """
        return self.mlp(features_tensor)

    def extract_embedding(self, trace_path):
        """
        Extract embedding from trace file

        Args:
            trace_path: Path to trace JSON file

        Returns:
            embedding: numpy array of shape (output_dim,)
        """
        # Load and extract features
        trace = self.feature_extractor.load_trace(trace_path)
        features = self.feature_extractor.extract_features(trace)

        # Convert to tensor
        features_tensor = self.features_to_tensor(features)

        # Forward pass
        with torch.no_grad():
            embedding = self.forward(features_tensor)

        return embedding.numpy()

    def save_embedding(self, trace_path, output_path):
        """
        Extract and save embedding to .npy file

        Args:
            trace_path: Path to input trace JSON file
            output_path: Path to output .npy file
        """
        embedding = self.extract_embedding(trace_path)

        # Create output directory if needed
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Save
        np.save(output_path, embedding)

        return embedding


def extract_stylus_embedding(trace_path, output_path=None, model=None):
    """
    Convenience function to extract stylus embedding

    Args:
        trace_path: Path to trace JSON file
        output_path: Optional path to save embedding (.npy)
        model: Optional pre-loaded StylusEmbedder instance

    Returns:
        embedding: numpy array of shape (128,)
    """
    if model is None:
        model = StylusEmbedder()
        model.eval()

    if output_path is not None:
        return model.save_embedding(trace_path, output_path)
    else:
        return model.extract_embedding(trace_path)


def main():
    """
    CLI tool for extracting stylus embeddings
    """
    import sys

    if len(sys.argv) < 2:
        print("Usage: python src/stylus_embed.py <trace_path> [output_path]")
        print("\nExample:")
        print("  python src/stylus_embed.py data/synthetic/stylus_traces/P001_T00_1.json")
        print("  python src/stylus_embed.py data/synthetic/stylus_traces/P001_T00_1.json output.npy")
        sys.exit(1)

    trace_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    print("=" * 60)
    print("Stylus Embedding Extractor")
    print("=" * 60)
    print(f"\nInput: {trace_path}")

    # Extract features first
    extractor = StylusFeatureExtractor()
    trace = extractor.load_trace(trace_path)
    features = extractor.extract_features(trace)

    print(f"\nExtracted features:")
    for name, value in features.items():
        print(f"  {name:20s}: {value:8.3f}")

    # Extract embedding
    embedder = StylusEmbedder()
    embedder.eval()

    if output_path:
        embedding = embedder.save_embedding(trace_path, output_path)
        print(f"\nOutput: {output_path}")
    else:
        embedding = embedder.extract_embedding(trace_path)

    print(f"\nEmbedding shape: {embedding.shape}")
    print(f"Embedding stats:")
    print(f"  Mean: {embedding.mean():.4f}")
    print(f"  Std:  {embedding.std():.4f}")
    print(f"  Min:  {embedding.min():.4f}")
    print(f"  Max:  {embedding.max():.4f}")
    print("=" * 60)


if __name__ == '__main__':
    main()
