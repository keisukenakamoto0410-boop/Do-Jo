# Video Review System for Interviewers

Complete video playback and review system for interviewers to evaluate candidate interviews.

## Overview

This system provides interviewers with a professional video review interface including:
- Advanced video player with playback controls
- Candidate information sidebar
- Automatic fluency analysis results
- Resume viewer
- Direct link to evaluation form

## ✅ Features Implemented

### 1. Advanced Video Player
- **HTML5 video playback** with custom controls
- **Playback speed control** (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- **Skip controls** (10 seconds forward/backward)
- **Volume control** with mute toggle
- **Fullscreen mode**
- **Progress bar** with seek functionality
- **Auto-hide controls** when playing
- **Click-to-play/pause** on video
- **Time display** (current / total)

### 2. Candidate Information Panel
- **Profile display** with name initials avatar
- **Japanese level badge** with color coding
- **Interview details** (category, date, time)
- **Resume viewer**:
  - Inline PDF preview
  - Download button
  - Upload date tracking
- **Email contact** quick action
- **Additional profile data** if available

### 3. Fluency Analysis Display
- **Overall score** with color-coded badge
- **Speech rate** (words per minute)
- **Pause frequency** (pauses per minute)
- **Filler word count** (あの, えっと, etc.)
- **Total duration** of interview
- **Analysis insights** and interpretation guide
- **Analysis timestamp**

### 4. Review Page Layout
- **Responsive grid layout** (2/3 video, 1/3 info on desktop)
- **Mobile-friendly** single column on small screens
- **Professional UI** with teal accent color
- **Loading states** and error handling
- **Navigation** back to dashboard

## 📁 Files Created

### API Routes

```
app/api/interview/[interviewId]/
└── details/
    └── route.ts              ✅ Get comprehensive interview details
```

### Pages

```
app/interviewer/interview/[interviewId]/
└── review/
    └── page.tsx              ✅ Video review page
```

### Components

```
components/interviewer/
├── InterviewPlayer.tsx       ✅ Advanced video player
└── CandidateInfo.tsx         ✅ Candidate information panel
```

## 🔧 API Endpoints

### Get Interview Details

```
GET /api/interview/[interviewId]/details

Response:
{
  "success": true,
  "interview": {
    "id": "uuid",
    "status": "COMPLETED",
    "scheduledAt": "2024-11-01T10:00:00Z",
    "conductedAt": "2024-11-01T10:25:00Z",
    "videoUrl": "/uploads/videos/interview_123.mp4",
    "candidate": {
      "id": "uuid",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "japaneseLevel": "N2",
      "profile": {...}
    },
    "interviewer": {
      "id": "uuid",
      "name": "田中花子",
      "email": "tanaka@example.com"
    },
    "slot": {
      "jobCategory": "IT",
      "startTime": "2024-11-01T10:00:00Z",
      "endTime": "2024-11-01T10:20:00Z"
    },
    "resume": {
      "id": "uuid",
      "fileUrl": "/uploads/resumes/resume_123.pdf",
      "fileName": "resume.pdf",
      "uploadedAt": "2024-10-20T..."
    },
    "evaluation": null,
    "fluencyAnalysis": {
      "id": "uuid",
      "speechRate": 135.5,
      "pauseFrequency": 8.2,
      "fillerCount": 12,
      "totalDuration": 840,
      "overallScore": 78,
      "analyzedAt": "2024-11-01T10:30:00Z"
    }
  }
}
```

**Access Control:**
- Requires authentication
- Accessible by:
  - Interview candidate
  - Interview interviewer
  - Admin users

## 🎮 Video Player Controls

### Playback Controls

| Control | Action | Keyboard Shortcut |
|---------|--------|------------------|
| Play/Pause | Toggle playback | Click video |
| Skip Back | -10 seconds | Button only |
| Skip Forward | +10 seconds | Button only |
| Volume | Adjust 0-100% | Slider |
| Mute | Toggle mute | Speaker icon |
| Speed | 0.5x - 2x | Speed menu |
| Fullscreen | Toggle fullscreen | Fullscreen icon |
| Seek | Jump to position | Progress bar |

### Playback Speeds

```
0.5x  - Very slow (50%)
0.75x - Slow (75%)
1x    - Normal speed
1.25x - Slightly fast
1.5x  - Fast
2x    - Very fast (200%)
```

**Use Cases:**
- **0.5x-0.75x**: Detailed analysis, catching nuances
- **1x**: Normal viewing
- **1.25x-1.5x**: Quick review, time-saving
- **2x**: Fast scan for specific moments

### Auto-Hide Controls

Controls automatically hide when:
- Video is playing
- Mouse leaves video area
- After 3 seconds of inactivity

Controls always visible when:
- Video is paused
- Mouse is over controls
- Volume/speed menu is open

## 📊 Fluency Analysis Metrics

### Speech Rate
- **Measurement**: Words per minute
- **Ideal Range**: 120-150 wpm
- **Calculation**: Total words / (duration in minutes)
- **Indicators**:
  - Too slow (<100): Hesitation, lack of confidence
  - Optimal (120-150): Natural, comfortable pace
  - Too fast (>180): Rushed, nervous

### Pause Frequency
- **Measurement**: Pauses per minute
- **Calculation**: Total pauses / (duration in minutes)
- **Indicators**:
  - Low (0-3): Continuous flow, may be too fast
  - Moderate (4-8): Natural pauses for thought
  - High (>10): Excessive hesitation

### Filler Count
- **Measurement**: Total count of filler words
- **Common Fillers**: あの、えっと、まあ、そう、なんか
- **Indicators**:
  - 0-5: Excellent fluency
  - 6-15: Moderate use
  - >15: Excessive reliance on fillers

### Overall Score
- **Range**: 0-100
- **Calculation**: Weighted average of all metrics
- **Ranges**:
  - 80-100: Excellent (Green)
  - 60-79: Good (Yellow)
  - 0-59: Needs improvement (Red)

## 🎨 UI Components

### InterviewPlayer Component

**Features:**
- Custom HTML5 video player
- Gradient overlay controls
- Hover-to-show interface
- Responsive design
- Time formatting
- Progress tracking

**Props:**
```typescript
interface InterviewPlayerProps {
  videoUrl: string;      // Path to video file
  title?: string;        // Display title (optional)
}
```

**Example:**
```tsx
<InterviewPlayer
  videoUrl="/uploads/videos/interview_123.mp4"
  title="山田太郎 - IT"
/>
```

### CandidateInfo Component

**Features:**
- Profile card with avatar
- Japanese level badge
- Interview details
- Resume viewer (PDF inline)
- Download button
- Email quick action

**Props:**
```typescript
interface CandidateInfoProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    japaneseLevel: string;
    profile?: any;
  };
  interviewDate: string;
  interviewTime: {
    start: string;
    end: string;
  };
  jobCategory: string;
  resume?: {
    id: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
  } | null;
}
```

**Example:**
```tsx
<CandidateInfo
  candidate={interview.candidate}
  interviewDate={interview.scheduledAt}
  interviewTime={{
    start: interview.slot.startTime,
    end: interview.slot.endTime,
  }}
  jobCategory={interview.slot.jobCategory}
  resume={interview.resume}
/>
```

## 🎯 Usage Flow

### Interviewer Journey

1. **Access Review Page**
   - Navigate from dashboard pending evaluations
   - Click "詳細を見る" on interview card
   - Or directly via `/interviewer/interview/[id]/review`

2. **Review Video**
   - Video auto-loads and displays
   - Use playback controls as needed:
     - Adjust speed for detailed review
     - Skip backward to re-watch sections
     - Pause to take notes
   - Check fluency analysis metrics

3. **Review Candidate Info**
   - Check Japanese level
   - Review resume (PDF inline)
   - Download resume if needed
   - Note interview details

4. **Submit Evaluation**
   - Click "評価を入力" button
   - Redirects to evaluation form
   - Or view existing evaluation if already submitted

## 🔒 Security & Validation

### Access Control
- ✅ Authentication required (INTERVIEWER only)
- ✅ Ownership verification (interviewer must own the interview)
- ✅ Admin access allowed

### Video Availability
- ✅ Check if video exists before rendering player
- ✅ Display message if video not yet uploaded
- ✅ Provide refresh option

### Error Handling
- ✅ Network errors (retry option)
- ✅ Missing interviews (404 handling)
- ✅ Permission errors (403 redirect)
- ✅ Loading states

## 📱 Responsive Design

### Desktop (>1024px)
```
┌─────────────────────┬────────────┐
│                     │            │
│   Video Player      │  Candidate │
│   (2/3 width)       │    Info    │
│                     │  (1/3 width)│
├─────────────────────┤            │
│                     │            │
│ Fluency Analysis    │            │
│                     │            │
└─────────────────────┴────────────┘
```

### Mobile (<1024px)
```
┌─────────────────────┐
│   Video Player      │
│   (Full width)      │
├─────────────────────┤
│ Fluency Analysis    │
├─────────────────────┤
│  Candidate Info     │
│   (Full width)      │
└─────────────────────┘
```

## 🎨 Color Scheme

### Japanese Level Badges
```
N1: Purple (#9333ea) - Highest proficiency
N2: Blue (#2563eb)
N3: Green (#16a34a)
N4: Yellow (#ca8a04)
N5: Orange (#ea580c) - Beginner
```

### Fluency Analysis Cards
```
Speech Rate:    Blue (#3b82f6)
Pause Frequency: Purple (#9333ea)
Filler Count:   Orange (#f97316)
Total Duration: Teal (#14b8a6)
```

### Score Colors
```
Excellent (80-100): Green (#10b981)
Good (60-79):      Yellow (#eab308)
Poor (0-59):       Red (#ef4444)
```

## 🚀 Performance Optimization

### Video Loading
- **Preload metadata** only (not full video)
- **Progressive download** as needed
- **Browser caching** enabled
- **Local storage** for MVP (future: CDN)

### Component Optimization
- **Lazy loading** for large components
- **Memoized calculations** for time formatting
- **Event delegation** for controls
- **Throttled updates** for progress bar

### Future Enhancements
- Video transcoding for multiple qualities
- Adaptive bitrate streaming
- Thumbnail preview on seek
- Cached analysis results

## 🧪 Testing

### Test Review Flow
```bash
# 1. Login as interviewer
interviewer1@dojo.com / interviewer123

# 2. Navigate to review page
/interviewer/interview/[id]/review

# 3. Test video player
- Play/pause
- Adjust speed (try 0.5x, 1.5x)
- Skip forward/backward
- Adjust volume
- Toggle fullscreen
- Seek to different positions

# 4. Test candidate info
- Verify all information displays
- Download resume
- Click email link

# 5. Test fluency analysis
- Verify metrics display correctly
- Check score color coding

# 6. Navigate to evaluation
- Click "評価を入力"
- Verify redirect to evaluation form
```

### Edge Cases
- ✅ Video not uploaded yet
- ✅ No fluency analysis available
- ✅ No resume uploaded
- ✅ Evaluation already submitted
- ✅ Network interruption during load
- ✅ Invalid interview ID
- ✅ Unauthorized access attempt

## 🐛 Troubleshooting

### Video won't play
**Causes:**
- Unsupported format
- Corrupted file
- Network issues
- Browser compatibility

**Solutions:**
1. Check video file format (MP4 recommended)
2. Verify file exists at URL
3. Test in different browser
4. Check browser console for errors

### Controls not responding
**Causes:**
- JavaScript error
- Event listener not attached
- Browser compatibility

**Solutions:**
1. Refresh page
2. Clear browser cache
3. Check browser console
4. Update browser

### PDF not displaying
**Causes:**
- Browser PDF viewer disabled
- File corrupted
- CORS issues

**Solutions:**
1. Enable PDF viewer in browser
2. Use download button instead
3. Try different browser
4. Check file permissions

### Fluency analysis missing
**Expected behavior** - Analysis is optional and may not be available for all interviews. The system will display a message indicating analysis is pending.

## 🔮 Future Enhancements

### Video Features
1. **Timestamp Markers**
   - Mark important moments
   - Add notes to timestamps
   - Jump to marked sections

2. **Side-by-side Transcript**
   - Auto-generated transcript
   - Highlight current word
   - Click to jump to timestamp

3. **Drawing/Annotation**
   - Draw on video frames
   - Highlight areas of interest
   - Save annotations

4. **Multiple Angles**
   - Switch between camera views
   - Picture-in-picture mode

### Analysis Features
1. **Detailed Breakdown**
   - Per-section analysis
   - Trend graphs
   - Comparison with averages

2. **AI Insights**
   - Emotion detection
   - Confidence level
   - Engagement score

3. **Export Options**
   - PDF report
   - CSV data
   - Share with team

### Collaboration
1. **Comments**
   - Add time-stamped comments
   - Reply to comments
   - Tag team members

2. **Shared Review**
   - Multiple reviewers
   - Collaborative evaluation
   - Discussion threads

## 📚 Related Documentation

- `REQUEST_APPROVAL_SYSTEM.md` - Booking request workflow
- `BOOKING_SYSTEM.md` - Interview booking
- `AUTH_SETUP.md` - Authentication system
- `DATABASE_SETUP.md` - Database configuration

## 🎓 Best Practices

### For Interviewers

1. **Watch Entire Video First**
   - Get overall impression
   - Note key moments
   - Plan evaluation approach

2. **Use Playback Speed Wisely**
   - 1x for first viewing
   - 0.75x for detailed analysis
   - 1.25x for review

3. **Take Notes**
   - Note timestamps of important moments
   - Document specific examples
   - Track patterns

4. **Review Fluency Analysis**
   - Use as supplement, not replacement
   - Consider context
   - Look for patterns

5. **Check Resume**
   - Verify claims in interview
   - Note experience level
   - Check for relevant skills

### For Evaluation

1. **Be Objective**
   - Use fluency data as reference
   - Consider Japanese level
   - Compare to job requirements

2. **Provide Specific Feedback**
   - Reference specific moments
   - Give concrete examples
   - Suggest improvements

3. **Consider Context**
   - Japanese level
   - Job category
   - Candidate background

4. **Be Constructive**
   - Balance positive and negative
   - Focus on growth
   - Encourage learning

## 📊 Analytics Tracking

### Metrics to Monitor
- Average review time per interview
- Playback speed distribution
- Feature usage (skip, speed, fullscreen)
- Resume download rate
- Evaluation completion rate

### Future Analytics Dashboard
- Review time trends
- Most-used features
- Browser/device distribution
- Video quality metrics
- User satisfaction scores
