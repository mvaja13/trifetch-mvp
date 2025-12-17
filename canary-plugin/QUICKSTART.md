# 🚀 Quick Start Guide

Get the Canary Wellbeing Insights demo running in 2 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

That's it! The application will be available at:

**http://localhost:3000**

## Try It Out

### Option 1: Meeting Analysis
1. Click **"Select Audio File"**
2. Upload any audio file (or use `public/sample-meeting.txt`)
3. Click **"Analyze Meeting"**
4. View results in ~2 seconds

### Option 2: HR Dashboard
1. Click **"HR Dashboard"** tab
2. View company-wide wellbeing metrics
3. Explore department comparisons
4. Check 30-day trends

## What You'll See

- **Stress scores** with color-coded indicators
- **Fatigue and cognitive load** metrics
- **Meeting sentiment** analysis
- **Burnout risk** assessments
- **Interactive charts** showing trends and timelines
- **Department comparisons** across the company

## Key Features

✅ Audio upload and mock processing
✅ Real-time biomarker visualization
✅ Meeting timeline heatmap
✅ HR dashboard with aggregate data
✅ Department-level insights
✅ 30-day historical trends
✅ Responsive design
✅ Privacy-focused UI

## Project Structure

```
canary-plugin/
├── app/
│   ├── api/v1/          # Mock API endpoints
│   ├── page.tsx         # Main application
│   └── layout.tsx
├── components/          # React components
├── types/              # TypeScript types
└── public/             # Static files
```

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Need Help?

See **TESTING.md** for detailed testing instructions
See **README.md** for full documentation

## Demo Info

- **Built by:** Gautam for Trifetch Trial
- **Tech Stack:** Next.js 15, React 18, TypeScript, TailwindCSS, Recharts
- **Purpose:** Demonstration of Canary Speech technology in corporate wellbeing use case
- **Data:** All data is mocked - no real audio processing occurs

---

Enjoy exploring the demo! 🐦
