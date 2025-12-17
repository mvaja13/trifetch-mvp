# Feature Overview

## Main Application Features

### 🎤 Meeting Analysis Tab

#### Audio Upload Interface
- Clean, intuitive file selector
- Accepts audio files (.mp3, .wav, .m4a, etc.)
- Upload button with disabled state
- Loading indicator during processing
- Privacy notice clearly displayed

#### Analysis Results Display

**Meeting Metadata Cards:**
- Duration (in minutes)
- Participant count
- Meeting type (standup, planning, review, all-hands)

**Biomarker Score Cards:**
Each score (0-100) displayed with:
- Large, bold number
- Color-coded text (green/yellow/red)
- Progress bar visualization
- Descriptive label

Scores include:
1. **Stress Score** - Overall stress level detected
2. **Fatigue Index** - Team energy and tiredness
3. **Cognitive Load** - Mental effort required

**Risk Indicators:**
- Meeting Sentiment badge (positive/neutral/negative)
- Burnout Risk badge (low/moderate/high)

**Recommendations Section:**
- Bulleted list of actionable suggestions
- Context-aware based on scores
- Examples:
  - "Consider scheduling breaks between meetings"
  - "High stress detected - recommend wellness check-in"
  - "Team wellbeing metrics within healthy range"

#### Meeting Timeline Heatmap

**Interactive Line Chart:**
- X-axis: Meeting minutes (0 to duration)
- Y-axis: Score (0-100)
- Two lines:
  - Red line: Stress level over time
  - Blue line: Cognitive load over time
- Hover tooltips showing exact values
- Legend explaining each line

**Summary Statistics:**
- Peak Stress (highest point)
- Peak Cognitive Load (highest point)
- Average Stress (mean value)

**"Analyze New Meeting" Button:**
- Resets view to upload screen
- Allows multiple analyses

---

### 📊 HR Dashboard Tab

#### Company Overview Section

**Four Key Metric Cards:**
1. **Employees Monitored** (blue card)
   - Total: 234 employees

2. **Avg Company Stress** (yellow card)
   - Score: 62/100

3. **High Burnout Risk** (red card)
   - Count: 10 employees

4. **Meetings Analyzed** (green card)
   - Total: 709 meetings

#### Department Comparison Section

**Bar Chart:**
- X-axis: Department names
- Y-axis: Score (0-100)
- Two bars per department:
  - Red: Average stress
  - Orange: Average fatigue
- Legend explaining colors
- Interactive tooltips

**Detailed Table:**
Columns:
- Department name
- Avg Stress (color-coded)
- Avg Fatigue (color-coded)
- Burnout Risk (badge with count)
- Total Meetings

Departments:
- Engineering (High stress: 68)
- Product (Moderate: 54)
- Sales (Highest: 72)
- Marketing (Lowest: 51)
- Customer Success (Moderate: 63)

#### 30-Day Stress Trend Section

**Line Chart:**
- X-axis: Dates (last 30 days)
- Y-axis: Score (0-100)
- Two lines:
  - Red: Average daily stress
  - Orange: Average daily fatigue
- Date formatting: "Dec 3" style
- Hover tooltips with full date
- Shows trend patterns over time

#### Privacy Notice

Yellow-highlighted section emphasizing:
- Opt-in monitoring
- Anonymous data collection
- No individual identification
- Aggregated insights only

---

## UI/UX Features

### Navigation
- **Tab System** at top of page
  - Meeting Analysis (default)
  - HR Dashboard
- Active tab highlighted with blue underline
- Smooth transitions between tabs

### Header
- **Blue background** (#2563eb)
- Large title: "Canary Wellbeing Insights"
- Subtitle: "AI-powered corporate wellbeing dashboard (Demo MVP)"
- Full-width, prominent

### Footer
- **Dark background** (#1f2937)
- Left side: Author credit and disclaimer
- Right side: Technology credit
- Responsive layout

### Loading States
- **Spinner animation** during processing
- "Analyzing meeting audio..." message
- Prevents multiple submissions
- Clear feedback to user

### Error States
- **Red text** for error messages
- Clear error descriptions
- "Failed to upload" with retry instructions
- Non-blocking (user can try again)

### Color Scheme

**Primary Colors:**
- Blue: #2563eb (primary actions, headers)
- Gray: #f3f4f6 (backgrounds)
- White: #ffffff (cards, content areas)

**Status Colors:**
- Green: Healthy/Low risk (0-49)
- Yellow: Moderate/Warning (50-69)
- Red: High/Critical (70-100)

**Data Visualization:**
- Stress: Red (#ef4444)
- Fatigue: Orange (#f59e0b)
- Cognitive Load: Blue (#3b82f6)

### Typography
- **Headers**: Bold, large (text-2xl, text-3xl)
- **Body**: Regular, readable (text-sm, text-base)
- **Labels**: Small, gray (text-xs, text-gray-600)
- **Values**: Bold, color-coded (text-3xl)

### Spacing & Layout
- **Container**: Max-width with padding
- **Cards**: White background, rounded corners, shadow
- **Grid**: Responsive (1 column mobile, 2-4 desktop)
- **Gaps**: Consistent 4-6 spacing

---

## Interaction Patterns

### File Upload Flow
1. User clicks "Select Audio File"
2. File browser opens
3. User selects file
4. Filename displays below input
5. "Analyze Meeting" button becomes enabled
6. User clicks button
7. Loading state shows
8. Results appear after ~2 seconds

### Dashboard Interaction
1. User clicks "HR Dashboard" tab
2. Tab underline moves
3. Content fades in
4. Charts load and animate
5. User can hover charts for details
6. Scroll to view all sections

### Chart Interactions
- **Hover**: Show tooltip with exact values
- **Legend**: Click to toggle line visibility (Recharts default)
- **Responsive**: Resize with window

---

## Responsive Design

### Desktop (>768px)
- Multi-column grids (2-4 columns)
- Full-width charts
- Side-by-side layouts
- Comfortable spacing

### Tablet (768px)
- 2-column grids
- Full-width charts
- Stacked sections
- Touch-friendly buttons

### Mobile (<768px)
- Single-column layout
- Scrollable tables
- Touch-optimized
- Larger tap targets

---

## Accessibility Features

- **Semantic HTML** (proper heading hierarchy)
- **Color contrast** (WCAG AA compliant)
- **Focus states** on interactive elements
- **Alt text** considerations
- **Keyboard navigation** support
- **Screen reader** friendly labels

---

## Performance Optimizations

- **Next.js App Router** for fast navigation
- **Client components** only where needed
- **Server components** for static content
- **Lazy loading** of charts
- **Optimized images** (if any)
- **CSS-in-JS** with Tailwind (minimal runtime)

---

## Data Flow

### Analysis Flow
```
User → AudioUpload Component
  ↓
POST /api/v1/analyses (upload file)
  ↓
Analysis ID returned
  ↓
GET /api/v1/analyses/{id} (fetch results)
  ↓
AnalysisResults Component
  ↓
MeetingHeatmap Component
```

### Dashboard Flow
```
User → HRDashboard Component
  ↓
GET /api/v1/dashboard
  ↓
Charts & Tables render
  ↓
User interaction (hover, scroll)
```

---

## State Management

### Local Component State (useState)
- Selected file
- Upload status
- Loading states
- Error messages
- Analysis results
- Active tab

### API State
- Fetched analysis data
- Dashboard data
- Loading indicators

No global state management needed (props & local state sufficient)

---

## API Response Examples

### Analysis Result
```json
{
  "analysis_id": "analysis_1733229999_abc123",
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
    {"minute": 2, "stress_level": 70, "cognitive_load": 58}
  ],
  "recommendations": [
    "Consider scheduling breaks between meetings"
  ]
}
```

### Dashboard Data
```json
{
  "departments": [
    {
      "department": "Engineering",
      "avg_stress": 68,
      "avg_fatigue": 62,
      "burnout_count": 3,
      "total_meetings": 145
    }
  ],
  "trend_data": [
    {
      "date": "2025-11-04",
      "avg_stress": 65,
      "avg_fatigue": 58,
      "meetings_count": 24
    }
  ],
  "summary": {
    "total_employees_monitored": 234,
    "avg_company_stress": 62,
    "high_burnout_risk_count": 10,
    "total_meetings_analyzed": 709
  }
}
```

---

## Success Indicators

When the app is working correctly, you should see:

✅ Clean, professional interface
✅ Smooth tab transitions
✅ Charts render without errors
✅ Colors match health indicators
✅ Loading states during async operations
✅ Error handling for edge cases
✅ Responsive layouts on all screen sizes
✅ Privacy notices visible
✅ Consistent spacing and typography
✅ Interactive charts with tooltips
✅ Realistic mock data
✅ Fast page loads (<2 seconds)

---

This document describes all user-facing features and interactions in the application.
