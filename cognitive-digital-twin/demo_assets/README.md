# Demo Assets - Quick Start Guide

This folder contains everything you need to create a professional demo video.

---

## 📁 Files in This Folder

1. **storyboard.txt** - Complete video script with timing (45-60s)
2. **recording_instructions.txt** - Detailed recording guide
3. **elevenlabs_voiceover_text.txt** - Text for AI voiceover (EASIEST)
4. **elevenlabs_script.py** - Python script for automated voiceover
5. **README.md** - This file

---

## 🎯 Quickest Way to Create Demo

### Option 1: Manual (Easiest - 30 minutes)

**Step 1: Generate Voiceover (5 minutes)**
1. Open `elevenlabs_voiceover_text.txt`
2. Go to https://elevenlabs.io (free signup)
3. Copy/paste each segment
4. Download MP3 files
5. Save to `demo_assets/voiceover/` folder

**Step 2: Record Screen (10 minutes)**
1. Launch Streamlit app: `streamlit run src/app.py`
2. Open QuickTime (Mac) or OBS (Windows)
3. Record screen while:
   - Selecting patient
   - Showing predictions
   - Moving what-if sliders
   - Viewing impact

**Step 3: Combine (15 minutes)**
1. Import screen recording to iMovie/Premiere
2. Import voiceover files
3. Sync audio with video
4. Add title cards
5. Export as MP4

---

### Option 2: Automated (Requires API key)

```bash
# Set your ElevenLabs API key
export ELEVEN_API_KEY="your_key_here"

# Run script
python demo_assets/elevenlabs_script.py

# Follow prompts
```

---

## 📋 Quick Checklist

**Before Recording:**
- [ ] ElevenLabs account created (free)
- [ ] Screen recording software installed
- [ ] Streamlit app tested and working
- [ ] Quiet recording environment

**Voiceover (5 min):**
- [ ] All 7 segments generated
- [ ] Files downloaded and organized
- [ ] Audio quality checked

**Screen Recording (10 min):**
- [ ] App launched at http://localhost:8501
- [ ] Browser zoom set to 125-150%
- [ ] Patient P005 selected (good example)
- [ ] What-if sliders ready to demo

**Video Editing (15 min):**
- [ ] Screen recording imported
- [ ] Voiceover files imported
- [ ] Audio synced with video
- [ ] Title cards added
- [ ] Final export complete

**Total Time:** ~30 minutes

---

## 🎤 ElevenLabs Quick Start

**No coding needed!**

1. **Sign up:** https://elevenlabs.io
   - Free: 10,000 characters/month
   - No credit card needed

2. **Generate audio:**
   - Copy text from `elevenlabs_voiceover_text.txt`
   - Paste into ElevenLabs
   - Select voice: "Adam" or "Bella"
   - Click "Generate"
   - Download MP3

3. **Recommended settings:**
   - Voice: Adam (professional male)
   - Stability: 50%
   - Clarity: 75%
   - Model: Eleven English v1

---

## 🎬 Recording Tips

**Screen Recording:**
- Use 1920x1080 resolution
- 30 fps minimum
- Hide desktop clutter
- Disable notifications

**Mouse Movements:**
- Move slowly and deliberately
- Pause 1 second after clicks
- No random movements

**App Preparation:**
- Select patient before recording
- Test sliders beforehand
- Set zoom level for readability

---

## 📂 Folder Structure

```
demo_assets/
├── storyboard.txt                 # Video script
├── recording_instructions.txt     # Detailed guide
├── elevenlabs_voiceover_text.txt  # Copy/paste for TTS
├── elevenlabs_script.py           # Automated generation
├── README.md                      # This file
└── voiceover/                     # Generated audio files
    ├── intro.mp3
    ├── overview.mp3
    ├── prediction.mp3
    ├── whatif.mp3
    ├── impact.mp3
    ├── pipeline.mp3
    └── closing.mp3
```

---

## ⚡ Fastest Path to Demo Video

**If you just want a quick demo:**

1. **Skip voiceover** - Record silent video, add music
2. **Or use simple script** - Read text yourself while recording
3. **Or use captions** - Add text overlays instead of voice

**30-second version:**
- Just show app interface (0-15s)
- Demo what-if sliders (15-25s)
- Show impact (25-30s)
- Done!

---

## 🆓 Free Alternatives to ElevenLabs

**Don't want to sign up?**

1. **Google TTS** (Built-in, free)
   - macOS: System Settings > Accessibility > Speech
   - Windows: Settings > Speech

2. **TTSMaker** (No signup)
   - https://ttsmaker.com
   - Paste text, download MP3

3. **Natural Reader** (Free tier)
   - https://www.naturalreaders.com

---

## 🎥 Video Editor Recommendations

**Free:**
- iMovie (Mac)
- DaVinci Resolve (Mac/Windows/Linux)
- Windows Video Editor (Windows)

**Paid:**
- Final Cut Pro (Mac) - $299
- Adobe Premiere Pro - $22/month
- Camtasia - $249

---

## 📞 Need Help?

1. Read `storyboard.txt` for detailed scene breakdown
2. Read `recording_instructions.txt` for step-by-step guide
3. Check `elevenlabs_voiceover_text.txt` for exact text to use

---

## ✅ Success Criteria

Your demo video should have:
- Clear visuals (readable text)
- Professional voiceover (or captions)
- Smooth transitions
- 45-60 seconds length
- Shows key features (predictions + what-if)

---

**Good luck with your demo! 🎬**
