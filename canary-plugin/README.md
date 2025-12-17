# 🐦 Canary Wellbeing Insights

### AI-powered corporate wellbeing dashboard (demo MVP)

**Canary Wellbeing Insights** is a demo application built for a Trifetch product trial.
It showcases how Canary Speech's vocal-biomarker technology can be extended into a new corporate use case:
**analyzing Zoom/Meet meeting audio to measure team stress, fatigue, cognitive load, and overall wellbeing.**

This MVP uses **mocked API responses** based on a realistic Canary Speech API spec.

---

## 🚀 Features

* 🎤 **Upload Meeting Audio** — simulate Zoom/Meet plugin capturing meeting voice
* 🤖 **Mock AI Analysis** — returns stress, fatigue, cognitive load, and sentiment scores
* 📊 **HR Dashboard** — view team stress trends, department comparison, and burnout risk
* 🔥 **Meeting Heatmap** — minute-by-minute stress levels
* 🛡 **Anonymous & Opt-In** — designed for ethical workplace use
* 🧪 **Realistic Mock API** — consistent with Canary Speech's voice-analysis model structure

---

## 🧠 How It Works

```
[Upload Meeting Audio]
        ↓
[Mock Canary API]
        ↓
[Voice Biomarker Scores]
        ↓
[Dashboard: Stress • Fatigue • Cognitive Load • Sentiment]
```

The app **does not use real Canary Speech models** —
all responses are generated using mocked analysis data.

---

## 📦 Tech Stack

* Frontend: **Next.js 15** (App Router) with **React 18**
* Backend: **Next.js API Routes** (Mock API server)
* Charts: **Recharts**
* Styling: **TailwindCSS**
* Language: **TypeScript**

---

## 🧪 Mock API Specification

### `POST /api/v1/analyses`

Uploads meeting audio → returns `analysis_id`.

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/analyses \
  -F "audio_file=@meeting.mp3"
```

**Response:**
```json
{
  "analysis_id": "analysis_1234567890_abc123",
  "status": "processing",
  "message": "Audio file received and processing started",
  "estimated_completion_seconds": 5
}
```

### `GET /api/v1/analyses/{id}`

Returns biomarker scores:

**Response:**
```json
{
  "analysis_id": "analysis_1234567890_abc123",
  "status": "completed",
  "meeting_metadata": {
    "duration_minutes": 45,
    "participant_count": 8,
    "meeting_type": "planning"
  },
  "biomarkers": {
    "stress_score": 68,
    "fatigue_index": 62,
    "cognitive_load": 55,
    "meeting_sentiment": "neutral",
    "burnout_risk": "moderate"
  },
  "timeline": [
    {"minute": 1, "stress_level": 65, "cognitive_load": 52},
    ...
  ],
  "recommendations": [
    "Consider scheduling breaks between meetings",
    "Team showing signs of fatigue - reduce meeting frequency"
  ]
}
```

### `GET /api/v1/dashboard`

Returns company-wide dashboard data with department stats and trends.

---

## 📁 Project Structure

```
canary-plugin/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── analyses/
│   │       │   ├── route.ts          # POST endpoint
│   │       │   └── [id]/
│   │       │       └── route.ts      # GET endpoint
│   │       └── dashboard/
│   │           └── route.ts          # Dashboard data
│   ├── layout.tsx
│   ├── page.tsx                      # Main page
│   └── globals.css
├── components/
│   ├── AudioUpload.tsx               # File upload component
│   ├── AnalysisResults.tsx           # Results display
│   ├── MeetingHeatmap.tsx            # Timeline chart
│   └── HRDashboard.tsx               # Dashboard view
├── types/
│   └── analysis.ts                   # TypeScript types
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## ▶️ Running the Demo

```bash
npm install
npm run dev
```

The app will start on:

```
http://localhost:3000
```

---

## 📹 Demo Flow (for reviewers)

1. Upload a sample meeting audio file (any audio file will work for demo)
2. System simulates Canary API processing (2 second delay)
3. Dashboard updates with:
   * Team stress score
   * Burnout risk
   * Meeting sentiment
   * Timeline heatmap
4. Switch to HR Dashboard tab to view:
   * Department comparison
   * 30-day stress trends
   * Company-wide metrics

---

## 🎨 Features Implemented

### Meeting Analysis Tab
- ✅ Audio file upload with drag-and-drop UI
- ✅ Mock processing with loading state
- ✅ Biomarker score display (stress, fatigue, cognitive load)
- ✅ Meeting sentiment and burnout risk indicators
- ✅ Actionable recommendations
- ✅ Interactive timeline heatmap (stress and cognitive load over time)

### HR Dashboard Tab
- ✅ Company overview metrics
- ✅ Department comparison bar chart
- ✅ Detailed department statistics table
- ✅ 30-day stress and fatigue trend chart
- ✅ Privacy and ethics notice

---

## 🛡 Disclaimer

This project is **for demonstration purposes only.**
It does **not** use the official Canary Speech API or any real medical/diagnostic models.
All data is synthetic and purely illustrative.

The application demonstrates:
- How Canary Speech technology could be applied to corporate wellbeing
- A realistic API structure for voice biomarker analysis
- Privacy-conscious design with anonymous, opt-in monitoring
- Actionable insights for HR and leadership teams

---

## 👤 Author

Built by **Gautam** for Trifetch's product evaluation trial.

---

## 🚀 Future Enhancements (Not Implemented)

If this were a production application, additional features could include:
- Real integration with Canary Speech API
- User authentication and role-based access
- Historical data storage and trend analysis
- Export reports to PDF/CSV
- Zoom/Meet plugin integration
- Alert system for high burnout risk
- Individual employee wellbeing tracking (with consent)
- Integration with HR systems

---

## 📝 Notes for Reviewers

This demo showcases:
1. **Full-stack Next.js application** with TypeScript
2. **RESTful API design** following the spec in carnery.readme
3. **Interactive data visualization** using Recharts
4. **Responsive UI** with TailwindCSS
5. **Mock data generation** that simulates realistic Canary Speech API responses
6. **Privacy-conscious design** with ethical considerations built-in

The application is ready to run out of the box with `npm install && npm run dev`.
