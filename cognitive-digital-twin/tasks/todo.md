# Theme Change: Dark to Light (Blue & White)

## Plan Overview
Convert the website from dark theme to light theme using blue and white colors for a trustworthy appearance.

## Todo Items

- [x] Update main CSS styling in app.py (lines 32-96)
  - Change background colors from dark to white/light blue
  - Change text colors from light to dark
  - Update border and divider colors
  - Update button colors to use blue as primary

- [x] Update Plotly chart colors in create_trajectory_chart() function
  - Update background to white
  - Update grid colors for light theme
  - Update text colors to dark
  - Keep blue/green accent colors, adjust for light background

- [x] Update inline styles throughout app.py
  - Patient profile cards (lines 249-263)
  - Risk level metrics (line 305)
  - Forecast details boxes (lines 336-345)
  - Intervention impact box (lines 350-355)

- [x] Test the application to ensure all changes look good

## Color Scheme
**Light Theme Palette:**
- Primary background: `#ffffff` (white)
- Secondary background: `#f0f9ff` (light blue)
- Card backgrounds: `#f8fafc` (off-white)
- Text primary: `#1e293b` (dark slate)
- Text secondary: `#64748b` (slate)
- Primary accent (blue): `#3b82f6`, `#2563eb`
- Borders: `#e2e8f0` (light gray)
- Success (green): `#10b981`
- Warning (orange): `#f59e0b`
- Error (red): `#ef4444`

## Review

### Summary of Changes
Successfully converted the Cognitive Digital Twin website from dark theme to light theme using blue and white colors for a trustworthy, professional appearance.

### Files Modified
- **src/app.py** - All theme-related changes in one file

### Specific Changes Made

#### 1. Main CSS Styling (lines 31-96)
- Changed main background from `#0e1117` to `#ffffff` (white)
- Updated heading colors from `#e0e0e0` to `#1e293b` (dark slate)
- Updated metric cards:
  - Background: `#1f2937` → `#f8fafc` (off-white)
  - Borders: `#374151` → `#e2e8f0` (light gray)
  - Labels: `#9ca3af` → `#64748b` (slate)
  - Values: `#f3f4f6` → `#1e293b` (dark slate)
- Updated sidebar background from `#111827` to `#f0f9ff` (light blue)
- Updated divider/border colors throughout
- Kept blue buttons (`#3b82f6`) as primary accent

#### 2. Plotly Chart Colors (lines 185-220)
- Changed chart background from dark to `#ffffff` (white)
- Updated grid colors from `#374151` to `#e2e8f0`
- Updated all text colors to `#1e293b` (dark slate)
- Updated historical score marker borders from white to dark for visibility
- Kept existing accent colors (blue, orange, green) which work well on light background

#### 3. Inline HTML Styles
- **Sidebar header** (line 239): Text color updated to dark
- **Patient profile card** (lines 250-265): Updated background, borders, and text colors
- **Risk level metric** (lines 316-318): Updated card background and label colors
- **Forecast details box** (lines 338-346): Updated all colors to light theme
- **Intervention impact box** (lines 352-356): Changed from dark green background to light green (`#d1fae5`) with darker text

### Testing
- Application tested successfully
- Streamlit server starts without errors
- All color changes applied correctly

### Impact Assessment
- **Minimal code changes**: Only color values were modified
- **No structural changes**: No code logic or functionality was altered
- **Single file impact**: All changes contained in src/app.py
- **Zero risk**: Simple color substitutions with no side effects

### Color Palette Used
- White backgrounds for trust and clarity
- Blue accents (`#3b82f6`) for primary actions and data
- Light blue sidebar (`#f0f9ff`) for subtle differentiation
- Dark slate text (`#1e293b`) for readability
- Light gray borders (`#e2e8f0`) for subtle separation
- Kept existing green/orange/red for success/warning/error states
