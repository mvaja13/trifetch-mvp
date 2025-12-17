# Testing Guide for Canary Wellbeing Insights

## Quick Start

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

---

## Testing the Meeting Analysis Feature

### Step 1: Upload Audio File
1. Click on the **"Meeting Analysis"** tab (should be selected by default)
2. Click **"Select Audio File"** button
3. Choose any audio file (or use `public/sample-meeting.txt` for testing)
4. Click **"Analyze Meeting"**

### Step 2: View Processing
- You'll see a loading spinner for ~2 seconds
- This simulates the Canary Speech API processing time

### Step 3: Review Results
Once processing completes, you'll see:

#### Meeting Metadata
- Duration (randomly generated between 15-60 minutes)
- Participant count (3-13 participants)
- Meeting type (standup, planning, review, or all-hands)

#### Biomarker Scores
- **Stress Score** (0-100): Higher = more stress detected
  - 🟢 Green: 0-49 (healthy)
  - 🟡 Yellow: 50-69 (moderate)
  - 🔴 Red: 70-100 (high stress)

- **Fatigue Index** (0-100): Measures team energy levels
- **Cognitive Load** (0-100): Mental effort required

#### Risk Indicators
- **Meeting Sentiment**: positive, neutral, or negative
- **Burnout Risk**: low, moderate, or high

#### Recommendations
Context-aware suggestions based on the analysis, such as:
- "Consider scheduling breaks between meetings"
- "High stress detected - recommend wellness check-in"
- "Team showing signs of fatigue - reduce meeting frequency"

### Step 4: View Timeline
- Scroll down to see the **Meeting Timeline** chart
- Shows minute-by-minute stress and cognitive load
- Interactive Recharts visualization
- Summary stats: Peak stress, Peak cognitive load, Avg stress

### Step 5: Analyze Another Meeting
- Click **"← Analyze New Meeting"** to upload another file
- Each analysis generates different random data to simulate variety

---

## Testing the HR Dashboard

### Step 1: Switch Tabs
- Click on the **"HR Dashboard"** tab at the top

### Step 2: Company Overview
View aggregated metrics:
- **Employees Monitored**: 234
- **Avg Company Stress**: 62
- **High Burnout Risk**: 10 employees
- **Total Meetings Analyzed**: 709

### Step 3: Department Comparison
- **Bar chart** showing stress and fatigue by department
- **Table** with detailed breakdown:
  - Engineering: High stress (68)
  - Sales: Highest stress (72)
  - Marketing: Lowest stress (51)
  - Product & Customer Success: Moderate

### Step 4: 30-Day Trends
- Line chart showing historical stress and fatigue patterns
- 30 days of simulated data
- Hover over points to see specific dates and values

---

## API Testing (Optional)

You can test the API endpoints directly using curl or Postman:

### Test Upload Endpoint
```bash
curl -X POST http://localhost:3000/api/v1/analyses \
  -F "audio_file=@sample-meeting.txt"
```

Expected response:
```json
{
  "analysis_id": "analysis_1733229999_abc123xyz",
  "status": "processing",
  "message": "Audio file received and processing started",
  "estimated_completion_seconds": 5
}
```

### Test Get Analysis Endpoint
```bash
curl http://localhost:3000/api/v1/analyses/any_id_here
```

Expected response: Full analysis object with biomarkers, timeline, etc.

### Test Dashboard Endpoint
```bash
curl http://localhost:3000/api/v1/dashboard
```

Expected response: Department stats, trend data, and summary metrics

---

## Expected Behavior

### Mock Data Generation
- Each API call generates **different random data**
- Data is realistic and follows patterns:
  - Stress/fatigue between 25-75
  - Timeline shows variation throughout meeting
  - Recommendations match the severity levels
  - Department stats remain consistent per session

### Responsive Design
- Application works on desktop and tablet sizes
- Charts resize automatically
- Tables scroll horizontally on mobile

### Error Handling
- If no file selected: "Please select an audio file" error
- Upload failures show: "Failed to upload audio file. Please try again."
- Dashboard load failures show error message

---

## Performance Notes

### Load Times
- Initial page load: ~1-2 seconds
- Audio upload response: Immediate (202 status)
- Analysis retrieval: ~1 second (simulated delay)
- Dashboard data load: ~1 second

### Browser Compatibility
Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

---

## Common Issues

### Port Already in Use
If port 3000 is busy:
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Charts Not Rendering
If charts don't appear:
1. Check browser console for errors
2. Ensure Recharts is installed: `npm list recharts`
3. Try refreshing the page

### TypeScript Errors
If you see TypeScript errors:
```bash
# Clean build
rm -rf .next
npm run dev
```

---

## Demo Script (For Presentations)

1. **Introduction** (30 seconds)
   - "This is Canary Wellbeing Insights, a demo showing how voice AI can monitor team wellbeing"
   - "All data is mocked - this is a proof of concept"

2. **Upload Demo** (1 minute)
   - Upload sample file
   - Wait for processing
   - Explain biomarker scores as they appear
   - Show timeline chart

3. **Dashboard Demo** (1 minute)
   - Switch to HR Dashboard tab
   - Point out high-stress departments (Sales, Engineering)
   - Show trend chart
   - Emphasize privacy notice

4. **Wrap-up** (30 seconds)
   - "This demonstrates the technical feasibility"
   - "Next steps would involve real Canary API integration"

---

## Validation Checklist

Before considering the demo complete, verify:

- ✅ Application starts without errors
- ✅ File upload works
- ✅ Analysis results display correctly
- ✅ All biomarker scores show with proper colors
- ✅ Timeline chart renders
- ✅ HR Dashboard loads
- ✅ Department comparison chart shows
- ✅ 30-day trend chart displays
- ✅ All tabs switch correctly
- ✅ "Analyze New Meeting" button resets the view
- ✅ Privacy notice is visible
- ✅ Footer shows author info

---

## Development Notes

### Mock Data Characteristics
- **Stress scores**: 30-70 range
- **Fatigue**: 25-75 range
- **Cognitive load**: 30-75 range
- **Meeting duration**: 15-60 minutes
- **Timeline**: One data point per minute
- **Participants**: 3-13 people

### Data Consistency
- Analysis ID includes timestamp for uniqueness
- Each request generates new random data
- Dashboard stats remain constant per session
- Recommendations adapt based on severity

---

## Troubleshooting

### No Data Showing
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for API calls
4. Verify server is running on port 3000

### Styling Issues
1. Check if Tailwind CSS is loaded
2. Verify `globals.css` is imported
3. Clear browser cache
4. Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### API Not Responding
1. Check terminal for errors
2. Verify Next.js server is running
3. Test API endpoint directly with curl
4. Check file permissions in `/app/api/` directory

---

## Next Steps for Production

If this were to go to production, you'd need to:

1. **Replace Mock API** with real Canary Speech integration
2. **Add Authentication** (OAuth, JWT)
3. **Database** for storing historical data
4. **User Management** for HR roles
5. **Consent System** for employees
6. **Data Privacy** compliance (GDPR, HIPAA if applicable)
7. **Real-time Processing** with WebSocket updates
8. **Export Features** (PDF reports, CSV data)
9. **Alert System** for high burnout risk
10. **Integration** with Zoom/Meet plugins

This demo proves the concept and UI/UX - ready for evaluation!
