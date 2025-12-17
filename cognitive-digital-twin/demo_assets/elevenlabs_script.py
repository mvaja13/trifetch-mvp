"""
ElevenLabs Text-to-Speech Script for Demo Voiceover

This script uses the ElevenLabs API to generate voiceover audio for the demo video.

Requirements:
    pip install elevenlabs

Usage:
    python demo_assets/elevenlabs_script.py
"""

import os
from pathlib import Path

# Install elevenlabs if not already installed
try:
    from elevenlabs import generate, save, set_api_key, Voice, VoiceSettings
except ImportError:
    print("Installing elevenlabs...")
    import subprocess
    subprocess.check_call(["pip", "install", "elevenlabs"])
    from elevenlabs import generate, save, set_api_key, Voice, VoiceSettings

# Set your API key (get from https://elevenlabs.io)
# Option 1: Set environment variable
# export ELEVEN_API_KEY="your_api_key_here"
# Option 2: Set directly (not recommended for production)
API_KEY = os.getenv("ELEVEN_API_KEY", "your_api_key_here")

if API_KEY == "your_api_key_here":
    print("⚠️  Please set your ElevenLabs API key!")
    print("   Option 1: export ELEVEN_API_KEY='your_key'")
    print("   Option 2: Edit this file and replace 'your_api_key_here'")
    exit(1)

set_api_key(API_KEY)

# Output directory
output_dir = Path("demo_assets/voiceover")
output_dir.mkdir(exist_ok=True)

# Voice settings
# Popular voices: "Rachel", "Adam", "Bella", "Antoni", "Josh"
VOICE_NAME = "Adam"  # Professional male voice
# or use "Bella" for professional female voice

# Voice settings for natural speech
voice_settings = VoiceSettings(
    stability=0.5,      # 0-1: Lower = more expressive, Higher = more stable
    similarity_boost=0.75,  # 0-1: How similar to original voice
    style=0.0,          # 0-1: Exaggeration of style
    use_speaker_boost=True
)

# Demo script segments (from storyboard.txt)
# Each segment corresponds to a scene in the video

scripts = {
    "intro": """
        Introducing our AI-powered cognitive decline prediction system.
    """,

    "overview": """
        Our system analyzes patient data to predict cognitive scores
        up to twenty-four months in advance.
    """,

    "prediction": """
        Using multimodal data from speech patterns and handwriting,
        the system generates predictions with confidence intervals,
        showing both expected decline and uncertainty.
    """,

    "whatif": """
        Healthcare providers can explore what-if scenarios,
        adjusting factors like sleep and physical activity,
        to show patients the potential impact of lifestyle changes.
    """,

    "impact": """
        The system quantifies intervention impact,
        helping patients understand how their choices affect outcomes.
    """,

    "pipeline": """
        The system combines audio and handwriting biomarkers,
        processed through deep learning models,
        to deliver accurate twenty-four month forecasts.
    """,

    "closing": """
        Ready to deploy for clinical trials and healthcare systems.
        Contact Trifetch to learn more.
    """
}

# Alternative: Full continuous script (if you prefer one audio file)
full_script = """
Introducing our AI-powered cognitive decline prediction system.

Our system analyzes patient data to predict cognitive scores up to twenty-four months in advance.

Using multimodal data from speech patterns and handwriting, the system generates predictions with confidence intervals, showing both expected decline and uncertainty.

Healthcare providers can explore what-if scenarios, adjusting factors like sleep and physical activity, to show patients the potential impact of lifestyle changes.

The system quantifies intervention impact, helping patients understand how their choices affect outcomes.

The system combines audio and handwriting biomarkers, processed through deep learning models, to deliver accurate twenty-four month forecasts.

Ready to deploy for clinical trials and healthcare systems. Contact Trifetch to learn more.
"""

def generate_voiceover(text, output_file, voice=VOICE_NAME):
    """
    Generate voiceover using ElevenLabs API

    Args:
        text: Text to convert to speech
        output_file: Path to save audio file
        voice: Voice name to use
    """
    print(f"Generating: {output_file.name}...")

    audio = generate(
        text=text.strip(),
        voice=Voice(
            voice_id=voice,
            settings=voice_settings
        ),
        model="eleven_monolingual_v1"  # or "eleven_multilingual_v2" for other languages
    )

    save(audio, str(output_file))
    print(f"  ✓ Saved to {output_file}")
    return output_file


def main():
    """
    Main function to generate all voiceover segments
    """
    print("=" * 60)
    print("ElevenLabs Demo Voiceover Generator")
    print("=" * 60)
    print(f"Voice: {VOICE_NAME}")
    print(f"Output directory: {output_dir}")
    print()

    choice = input("Generate (1) individual segments or (2) full script? [1/2]: ").strip()

    if choice == "1":
        # Generate individual segments
        print("\nGenerating individual segments...")

        for scene_name, text in scripts.items():
            output_file = output_dir / f"{scene_name}.mp3"
            generate_voiceover(text, output_file)

        print("\n" + "=" * 60)
        print(f"✅ Generated {len(scripts)} voiceover segments")
        print("=" * 60)
        print("\nFiles saved in:", output_dir)
        print("\nNext steps:")
        print("  1. Review each audio file")
        print("  2. Adjust timing in video editor")
        print("  3. Sync with screen recording")

    elif choice == "2":
        # Generate full continuous script
        print("\nGenerating full script...")

        output_file = output_dir / "full_voiceover.mp3"
        generate_voiceover(full_script, output_file)

        print("\n" + "=" * 60)
        print("✅ Generated full voiceover")
        print("=" * 60)
        print("\nFile saved:", output_file)
        print("\nNext steps:")
        print("  1. Review audio file")
        print("  2. Import to video editor")
        print("  3. Split into segments as needed")
        print("  4. Sync with visuals")

    else:
        print("Invalid choice. Exiting.")
        return

    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
