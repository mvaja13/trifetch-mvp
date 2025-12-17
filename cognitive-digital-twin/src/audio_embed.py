"""
Audio Embedding Extractor using wav2vec2

Extracts fixed-size embeddings from audio files using Hugging Face wav2vec2 model.

Dependencies:
    pip install torch torchaudio transformers

Usage:
    from audio_embed import extract_audio_embedding

    embedding = extract_audio_embedding('path/to/audio.wav')
    # Returns: numpy array of shape (128,)

Example:
    python src/audio_embed.py data/sample_audio/sample_00.wav
"""

import torch
from transformers import Wav2Vec2Processor, Wav2Vec2Model
import numpy as np
from pathlib import Path
import scipy.io.wavfile as wavfile
import warnings
warnings.filterwarnings('ignore')


class AudioEmbedder:
    """
    Wav2vec2-based audio embedding extractor
    """

    def __init__(self, model_name='facebook/wav2vec2-base-960h', target_dim=128):
        """
        Initialize wav2vec2 model

        Args:
            model_name: Hugging Face model identifier
            target_dim: Target embedding dimension (will project down from 768)
        """
        self.target_dim = target_dim
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'

        print(f"Loading wav2vec2 model: {model_name}")
        print(f"Using device: {self.device}")

        # Load processor and model
        self.processor = Wav2Vec2Processor.from_pretrained(model_name)
        self.model = Wav2Vec2Model.from_pretrained(model_name)
        self.model.to(self.device)
        self.model.eval()

        # Create projection layer to reduce from 768 -> target_dim
        self.projection = torch.nn.Linear(768, target_dim)
        self.projection.to(self.device)

        print(f"Model loaded successfully (output dim: {target_dim})")

    def load_audio(self, audio_path, target_sr=16000):
        """
        Load audio file and resample to target sample rate

        Args:
            audio_path: Path to WAV file
            target_sr: Target sample rate (wav2vec2 expects 16kHz)

        Returns:
            waveform: numpy array of shape (num_samples,)
            sample_rate: Sample rate
        """
        # Load with scipy
        sample_rate, waveform = wavfile.read(audio_path)

        # Convert to float32
        if waveform.dtype == np.int16:
            waveform = waveform.astype(np.float32) / 32768.0
        elif waveform.dtype == np.int32:
            waveform = waveform.astype(np.float32) / 2147483648.0

        # Convert stereo to mono if needed
        if len(waveform.shape) > 1:
            waveform = np.mean(waveform, axis=1)

        # Simple resampling if needed (nearest neighbor)
        if sample_rate != target_sr:
            # Simple resampling using scipy
            from scipy import signal
            num_samples = int(len(waveform) * target_sr / sample_rate)
            waveform = signal.resample(waveform, num_samples)
            sample_rate = target_sr

        return waveform, sample_rate

    def extract_embedding(self, audio_path):
        """
        Extract embedding from audio file

        Args:
            audio_path: Path to WAV file

        Returns:
            embedding: numpy array of shape (target_dim,)
        """
        # Load audio
        waveform, sr = self.load_audio(audio_path)

        # Process audio
        inputs = self.processor(
            waveform,
            sampling_rate=sr,
            return_tensors="pt",
            padding=True
        )

        # Move to device
        input_values = inputs.input_values.to(self.device)

        # Extract features
        with torch.no_grad():
            outputs = self.model(input_values)
            # outputs.last_hidden_state shape: (batch, time, 768)

            # Mean pool over time dimension
            embedding = torch.mean(outputs.last_hidden_state, dim=1)  # (batch, 768)

            # Project to target dimension
            embedding = self.projection(embedding)  # (batch, target_dim)

            # Remove batch dimension and convert to numpy
            embedding = embedding.squeeze().cpu().numpy()

        return embedding

    def save_embedding(self, audio_path, output_path):
        """
        Extract and save embedding to .npy file

        Args:
            audio_path: Path to input WAV file
            output_path: Path to output .npy file
        """
        embedding = self.extract_embedding(audio_path)

        # Create output directory if needed
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Save
        np.save(output_path, embedding)

        return embedding


def extract_audio_embedding(audio_path, output_path=None, model=None):
    """
    Convenience function to extract audio embedding

    Args:
        audio_path: Path to WAV file
        output_path: Optional path to save embedding (.npy)
        model: Optional pre-loaded AudioEmbedder instance

    Returns:
        embedding: numpy array of shape (128,)
    """
    if model is None:
        model = AudioEmbedder()

    if output_path is not None:
        return model.save_embedding(audio_path, output_path)
    else:
        return model.extract_embedding(audio_path)


def main():
    """
    CLI tool for extracting audio embeddings
    """
    import sys

    if len(sys.argv) < 2:
        print("Usage: python src/audio_embed.py <audio_path> [output_path]")
        print("\nExample:")
        print("  python src/audio_embed.py data/sample_audio/sample_00.wav")
        print("  python src/audio_embed.py data/sample_audio/sample_00.wav output.npy")
        sys.exit(1)

    audio_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    print("=" * 60)
    print("Audio Embedding Extractor")
    print("=" * 60)
    print(f"\nInput: {audio_path}")

    # Extract embedding
    embedder = AudioEmbedder()

    if output_path:
        embedding = embedder.save_embedding(audio_path, output_path)
        print(f"Output: {output_path}")
    else:
        embedding = embedder.extract_embedding(audio_path)

    print(f"\nEmbedding shape: {embedding.shape}")
    print(f"Embedding stats:")
    print(f"  Mean: {embedding.mean():.4f}")
    print(f"  Std:  {embedding.std():.4f}")
    print(f"  Min:  {embedding.min():.4f}")
    print(f"  Max:  {embedding.max():.4f}")
    print("=" * 60)


if __name__ == '__main__':
    main()
