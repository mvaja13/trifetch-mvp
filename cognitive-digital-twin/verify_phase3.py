"""
Phase 3 Verification Script

Checks that fusion and forecast models are working correctly
"""

import torch
import sys
sys.path.insert(0, 'src')

from fusion_model import FusionModel
from forecast_model import ForecastModel


def verify_phase3():
    print("=" * 60)
    print("Phase 3 Verification")
    print("=" * 60)

    errors = []

    # 1. Test Fusion Model
    print("\n[1] Checking Fusion Model...")

    try:
        fusion = FusionModel(
            audio_dim=128,
            stylus_dim=128,
            hidden_dim=128,
            num_heads=2,
            num_layers=2
        )
        fusion.eval()

        num_params = fusion.get_num_parameters()
        print(f"  ✓ Model instantiated")
        print(f"  ✓ Parameters: {num_params:,}")

        # Check parameter count (should be < 500K)
        if num_params > 500000:
            errors.append(f"Fusion model too large: {num_params} params (max 500K)")
        else:
            print(f"  ✓ Model size OK (<500K)")

        # Test forward pass - single sample
        audio_emb = torch.randn(128)
        stylus_emb = torch.randn(128)
        age = 72.0
        baseline = 95.0

        with torch.no_grad():
            output = fusion(audio_emb, stylus_emb, age, baseline)

        if output.shape != torch.Size([128]):
            errors.append(f"Expected output shape (128,), got {output.shape}")
        else:
            print(f"  ✓ Single sample output shape: {output.shape}")

        # Test forward pass - batch
        audio_batch = torch.randn(4, 128)
        stylus_batch = torch.randn(4, 128)
        ages = torch.tensor([70.0, 75.0, 80.0, 72.0])
        baselines = torch.tensor([92.0, 95.0, 88.0, 96.0])

        with torch.no_grad():
            output_batch = fusion(audio_batch, stylus_batch, ages, baselines)

        if output_batch.shape != torch.Size([4, 128]):
            errors.append(f"Expected batch output shape (4, 128), got {output_batch.shape}")
        else:
            print(f"  ✓ Batch output shape: {output_batch.shape}")

        # Check output values are reasonable
        if not torch.isfinite(output_batch).all():
            errors.append("Fusion model produced invalid (inf/nan) values")
        else:
            print(f"  ✓ Output values are finite")

    except Exception as e:
        errors.append(f"Fusion model error: {str(e)}")

    # 2. Test Forecast Model
    print("\n[2] Checking Forecast Model...")

    try:
        forecast = ForecastModel(
            input_dim=128,
            hidden_dim=64,
            num_layers=2,
            output_horizons=2
        )
        forecast.eval()

        num_params = forecast.get_num_parameters()
        print(f"  ✓ Model instantiated")
        print(f"  ✓ Parameters: {num_params:,}")

        # Check parameter count (should be < 500K)
        if num_params > 500000:
            errors.append(f"Forecast model too large: {num_params} params (max 500K)")
        else:
            print(f"  ✓ Model size OK (<500K)")

        # Test forward pass
        batch_size = 4
        seq_len = 3
        fused_emb = torch.randn(batch_size, seq_len, 128)
        timestamps = torch.tensor([[0, 6, 12]] * batch_size).float()
        scores = torch.tensor([[95, 92, 90]] * batch_size).float()

        with torch.no_grad():
            predictions = forecast(fused_emb, timestamps, scores)

        if predictions.shape != torch.Size([batch_size, 2]):
            errors.append(f"Expected predictions shape (4, 2), got {predictions.shape}")
        else:
            print(f"  ✓ Predictions shape: {predictions.shape}")

        # Check predictions are in reasonable range (0-100)
        if (predictions < 0).any() or (predictions > 150).any():
            errors.append(f"Predictions out of reasonable range: [{predictions.min():.1f}, {predictions.max():.1f}]")
        else:
            print(f"  ✓ Predictions in reasonable range: [{predictions.min():.1f}, {predictions.max():.1f}]")

        # Test MC dropout confidence
        mean_pred, std_pred = forecast.predict_with_confidence(
            fused_emb[0], timestamps[0], scores[0], n_samples=5
        )

        if mean_pred.shape != torch.Size([2]) or std_pred.shape != torch.Size([2]):
            errors.append("MC dropout confidence shape mismatch")
        else:
            print(f"  ✓ MC dropout confidence works")
            print(f"    Mean: [{mean_pred[0]:.1f}, {mean_pred[1]:.1f}]")
            print(f"    Std:  [{std_pred[0]:.2f}, {std_pred[1]:.2f}]")

    except Exception as e:
        errors.append(f"Forecast model error: {str(e)}")

    # 3. Test End-to-End Pipeline
    print("\n[3] Testing end-to-end pipeline...")

    try:
        # Simulate full pipeline
        # Audio + Stylus -> Fusion -> Forecast

        batch_size = 2
        seq_len = 3

        # Step 1: Generate fusion embeddings for sequence
        fusion.eval()
        fused_sequence = []

        for t in range(seq_len):
            audio = torch.randn(batch_size, 128)
            stylus = torch.randn(batch_size, 128)
            ages = torch.tensor([70.0, 75.0])
            baselines = torch.tensor([95.0, 92.0])

            with torch.no_grad():
                fused = fusion(audio, stylus, ages, baselines)
            fused_sequence.append(fused)

        fused_sequence = torch.stack(fused_sequence, dim=1)  # (batch, seq, 128)
        print(f"  ✓ Fused sequence shape: {fused_sequence.shape}")

        # Step 2: Forecast
        timestamps = torch.tensor([[0, 6, 12], [0, 6, 12]]).float()
        scores = torch.tensor([[95, 93, 91], [92, 90, 88]]).float()

        forecast.eval()
        with torch.no_grad():
            predictions = forecast(fused_sequence, timestamps, scores)

        print(f"  ✓ End-to-end predictions: {predictions.shape}")
        print(f"    Patient 1: 12m={predictions[0,0]:.1f}, 24m={predictions[0,1]:.1f}")
        print(f"    Patient 2: 12m={predictions[1,0]:.1f}, 24m={predictions[1,1]:.1f}")

    except Exception as e:
        errors.append(f"End-to-end pipeline error: {str(e)}")

    # 4. Check combined parameter count
    print("\n[4] Checking combined model size...")

    total_params = fusion.get_num_parameters() + forecast.get_num_parameters()
    print(f"  Fusion model:   {fusion.get_num_parameters():>8,} params")
    print(f"  Forecast model: {forecast.get_num_parameters():>8,} params")
    print(f"  Total:          {total_params:>8,} params")

    if total_params > 1000000:
        errors.append(f"Combined models too large: {total_params:,} params (max 1M)")
    else:
        print(f"  ✓ Combined size OK (<1M)")

    # Summary
    print("\n" + "=" * 60)
    if errors:
        print("❌ VERIFICATION FAILED")
        print("\nErrors found:")
        for e in errors:
            print(f"  - {e}")
    else:
        print("✅ PHASE 3 COMPLETE - All checks passed!")
        print("\nModel summary:")
        print(f"  • Fusion model: {fusion.get_num_parameters():,} parameters")
        print(f"  • Forecast model: {forecast.get_num_parameters():,} parameters")
        print(f"  • Total: {total_params:,} parameters")
        print("\nCapabilities:")
        print("  • Multimodal fusion (audio + stylus + demographics)")
        print("  • Temporal forecasting with GRU")
        print("  • Confidence intervals via MC dropout")
        print("  • End-to-end differentiable pipeline")
        print("\nNext step: Run Phase 4 (training)")
    print("=" * 60)

    return len(errors) == 0


if __name__ == '__main__':
    verify_phase3()
