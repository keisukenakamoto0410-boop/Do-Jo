# Fluency Analysis System

Automated speech fluency analysis for interview videos using AI-powered analysis.

## Overview

The fluency analysis system automatically evaluates candidate speech patterns from uploaded interview videos. For the MVP, this uses mock data to simulate analysis. The production version will integrate with Google Cloud Speech-to-Text API or similar services.

## ✅ Features Implemented

### 1. Mock Fluency Analyzer
- **Realistic score generation** based on ranges
- **Automatic scoring calculation** from metrics
- **Benchmark data** for comparison
- **Score interpretation** with recommendations
- **Simulated processing time** (1-3 seconds)

### 2. Analysis Metrics

#### Speech Rate (発話速度)
- **Unit**: モーラ/秒 (mora per second)
- **Range**: 2.5 - 4.0
- **Ideal**: 3.0 - 3.5
- **Score Impact**: 40% weight in overall score

#### Pause Frequency (ポーズ頻度)
- **Unit**: ポーズ/分 (pauses per minute)
- **Range**: 5 - 15
- **Ideal**: 7 - 10
- **Score Impact**: 30% weight in overall score

#### Filler Count (フィラーワード数)
- **Unit**: Total count
- **Range**: 3 - 20
- **Common Fillers**: あの、えっと、まあ、そう、なんか
- **Score Impact**: 30% weight in overall score
- **Normalized**: Calculated as fillers per minute

#### Overall Score (総合スコア)
- **Scale**: 1 - 5 (stored as 0-100 in database)
- **Calculation**: Weighted average of all metrics
- **Interpretation**:
  - 4.0-5.0: Excellent (優秀) - Green
  - 3.0-3.9: Good (良好) - Yellow
  - 2.0-2.9: Needs Improvement (要改善) - Orange
  - 1.0-1.9: Needs Significant Work (要強化) - Red

### 3. Automatic Triggering
- **Triggered**: Automatically after video upload
- **Async Processing**: Non-blocking background analysis
- **Status Updates**: Console logging of progress
- **Error Handling**: Graceful failure with logging

### 4. Visual Results Display
- **Doughnut Chart**: Overall score gauge (0-100)
- **Bar Chart**: Speech rate comparison with benchmarks
- **Radar Chart**: Multi-metric performance visualization
- **Progress Bars**: Individual metric indicators
- **Color-Coded Cards**: Easy-to-read metric cards

### 5. Insights & Recommendations
- **Personalized feedback** based on scores
- **Actionable tips** for improvement
- **Benchmark comparison** with averages
- **Next steps** guidance

## 📁 Files Created

### Libraries

```
lib/analysis/
└── fluency-analyzer.ts           ✅ Mock analysis engine
```

### API Routes

```
app/api/analysis/
├── trigger/
│   └── route.ts                  ✅ Manually trigger analysis
└── [interviewId]/
    └── route.ts                  ✅ Get analysis results
```

### Components

```
components/analysis/
└── FluencyResults.tsx            ✅ Results visualization
```

### Updated Files

```
app/api/interview/[interviewId]/
└── upload-video/
    └── route.ts                  🔄 Auto-trigger analysis
```

## 🔧 API Endpoints

### Trigger Analysis

```
POST /api/analysis/trigger

Body:
{
  "interviewId": "uuid"
}

Response (Success):
{
  "success": true,
  "message": "流暢性分析が完了しました",
  "analysis": {
    "id": "uuid",
    "speechRate": 3.25,
    "pauseFrequency": 8.5,
    "fillerCount": 7,
    "totalDuration": 840,
    "overallScore": 76,
    "analyzedAt": "2024-11-01T10:30:00Z"
  }
}

Response (Already Analyzed):
{
  "success": true,
  "message": "分析は既に完了しています",
  "analysis": {...}
}
```

**Access Control:**
- Requires authentication
- Accessible by candidate, interviewer, or admin
- Must have video uploaded

### Get Analysis Results

```
GET /api/analysis/[interviewId]

Response (Success):
{
  "success": true,
  "analysis": {
    "id": "uuid",
    "interviewId": "uuid",
    "metrics": {
      "speechRate": {
        "value": 3.25,
        "unit": "モーラ/秒",
        "benchmark": {
          "min": 2.5,
          "max": 4.0,
          "avg": 3.2
        }
      },
      "pauseFrequency": {
        "value": 8.5,
        "unit": "ポーズ/分",
        "benchmark": {
          "min": 5,
          "max": 15,
          "avg": 8.5
        }
      },
      "fillerCount": {
        "value": 7,
        "unit": "回",
        "benchmark": {
          "min": 3,
          "max": 20,
          "avg": 10
        }
      },
      "totalDuration": {
        "value": 840,
        "unit": "秒"
      }
    },
    "overallScore": {
      "value": 76,
      "scale": "0-100",
      "scoreOn5Scale": 3.8,
      "interpretation": {
        "label": "良好",
        "color": "yellow",
        "description": "基本的に流暢ですが、さらに改善の余地があります。"
      }
    },
    "analyzedAt": "2024-11-01T10:30:00Z",
    "candidate": {
      "name": "山田太郎",
      "japaneseLevel": "N2"
    }
  }
}

Response (Not Analyzed):
{
  "success": false,
  "message": "流暢性分析はまだ実施されていません",
  "analysis": null
}
```

## 🎯 Usage Flow

### Automatic Flow (Default)

1. **Candidate uploads video**
   - POST `/api/interview/[id]/upload-video`
   - Video saved to storage
   - Interview status → COMPLETED

2. **Analysis auto-triggers**
   - Background process starts
   - Mock analysis runs (1-3 seconds)
   - Results saved to database

3. **Interviewer views results**
   - Navigate to review page
   - Analysis results displayed automatically
   - Charts and visualizations shown

### Manual Trigger Flow

```bash
# If analysis didn't run automatically
POST /api/analysis/trigger
{
  "interviewId": "interview-uuid"
}
```

### Viewing Results

```bash
# Via review page
/interviewer/interview/[id]/review

# Via API
GET /api/analysis/[interviewId]
```

## 📊 Score Calculation

### Speech Rate Score

```javascript
if (speechRate >= 3.5) return 5;      // Excellent
if (speechRate >= 3.2) return 4;      // Good
if (speechRate >= 2.9) return 3;      // Average
if (speechRate >= 2.6) return 2;      // Below average
return 1;                              // Poor
```

### Pause Frequency Score

```javascript
if (pauseFrequency >= 7 && pauseFrequency <= 10) return 5;  // Optimal
if (pauseFrequency >= 6 && pauseFrequency <= 12) return 4;  // Good
if (pauseFrequency >= 5 && pauseFrequency <= 14) return 3;  // Average
if (pauseFrequency >= 4 || pauseFrequency <= 15) return 2;  // Sub-optimal
return 1;                                                    // Poor
```

### Filler Count Score (Normalized)

```javascript
const fillersPerMinute = (fillerCount / totalDuration) * 60;

if (fillersPerMinute <= 0.5) return 5;   // Excellent
if (fillersPerMinute <= 1.0) return 4;   // Good
if (fillersPerMinute <= 1.5) return 3;   // Average
if (fillersPerMinute <= 2.5) return 2;   // Below average
return 1;                                 // Poor
```

### Overall Score

```javascript
const overallScore =
  (speechRateScore * 0.4) +
  (pauseScore * 0.3) +
  (fillerScore * 0.3);

// Rounded to 1 decimal place
// Converted to 0-100 scale for database storage
```

## 🎨 Visualization Components

### Doughnut Chart (Overall Score)
- **Library**: Chart.js (react-chartjs-2)
- **Type**: Doughnut
- **Display**: Score percentage with center text
- **Colors**: Dynamic based on score range
- **Cutout**: 75% for donut effect

### Bar Chart (Speech Rate)
- **Library**: Chart.js
- **Type**: Bar
- **Data**: Min, Your Score, Average, Max
- **Colors**: Gray, Blue, Teal, Gray
- **Y-Axis**: 0-5 scale

### Radar Chart (Performance)
- **Library**: Chart.js
- **Type**: Radar
- **Metrics**: 4 dimensions (speed, pauses, fillers, overall)
- **Datasets**: Your score (blue) vs Average (teal)
- **Scale**: 0-5

### Progress Bars
- **Custom HTML/CSS**
- **Width**: Percentage of benchmark max
- **Colors**: Metric-specific (blue, purple, orange)

## 🔒 Security & Validation

### Analysis Trigger
- ✅ Authentication required
- ✅ Video must be uploaded
- ✅ Prevents duplicate analysis
- ✅ Access control (candidate/interviewer/admin)

### Results Access
- ✅ Authentication required
- ✅ Ownership verification
- ✅ Proper 404 for non-existent analysis

### Error Handling
- ✅ Graceful failure logging
- ✅ Non-blocking async execution
- ✅ Clear error messages

## 🧪 Testing

### Test Analysis Flow

```bash
# 1. Upload video as candidate
POST /api/interview/[id]/upload-video
(with video file)

# 2. Wait 1-3 seconds (simulated processing)
# Analysis runs automatically in background

# 3. Check console logs
Should see:
  🔍 [Mock Analysis] Starting fluency analysis...
  ✅ [Mock Analysis] Analysis complete
  ✅ Fluency analysis saved

# 4. View results as interviewer
GET /interviewer/interview/[id]/review
Should see fluency analysis with charts

# 5. Verify via API
GET /api/analysis/[interviewId]
Should return detailed analysis
```

### Manual Trigger Test

```bash
# Trigger analysis manually
POST /api/analysis/trigger
{
  "interviewId": "your-interview-id"
}

# Should return:
{
  "success": true,
  "message": "流暢性分析が完了しました",
  "analysis": {...}
}
```

### Edge Cases
- ✅ Video not uploaded
- ✅ Analysis already exists
- ✅ Invalid interview ID
- ✅ Unauthorized access
- ✅ Analysis failure (error logging)

## 🐛 Troubleshooting

### Analysis not running

**Check:**
1. Video is uploaded successfully
2. Console logs for error messages
3. Database for FluencyAnalysis record

**Solution:**
```bash
# Manually trigger analysis
POST /api/analysis/trigger
{
  "interviewId": "interview-uuid"
}
```

### Results not displaying

**Check:**
1. Analysis completed (check console)
2. Database has FluencyAnalysis record
3. Browser console for errors

**Solution:**
- Refresh the review page
- Check network tab for API errors
- Verify interview ID is correct

### Charts not rendering

**Causes:**
- Chart.js not properly imported
- Data format incorrect
- Canvas element issue

**Solutions:**
1. Verify Chart.js installation: `npm list chart.js`
2. Check browser console for errors
3. Ensure "use client" directive present

## 🔮 Production Implementation

### Google Cloud Speech-to-Text Integration

```typescript
// Install dependencies
npm install @google-cloud/speech
npm install fluent-ffmpeg

// Environment variables
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CREDENTIALS_PATH=/path/to/credentials.json

// Implementation
import speech from '@google-cloud/speech';
import ffmpeg from 'fluent-ffmpeg';

async function analyzeWithGoogleAPI(videoUrl: string) {
  // 1. Download video
  const videoBuffer = await downloadVideo(videoUrl);

  // 2. Extract audio
  const audioBuffer = await extractAudio(videoBuffer);

  // 3. Configure Speech-to-Text
  const client = new speech.SpeechClient({
    keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS_PATH
  });

  // 4. Request transcription
  const [response] = await client.longRunningRecognize({
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'ja-JP',
      enableWordTimeOffsets: true,
      enableAutomaticPunctuation: true,
      enableSpeakerDiarization: false,
    },
    audio: {
      content: audioBuffer.toString('base64'),
    },
  });

  // 5. Analyze results
  const transcript = response.results
    .map(result => result.alternatives[0].transcript)
    .join(' ');

  const words = response.results
    .flatMap(result => result.alternatives[0].words || []);

  // 6. Calculate metrics
  const speechRate = calculateSpeechRate(words);
  const pauseFrequency = calculatePauses(words);
  const fillerCount = countFillers(transcript);

  return {
    speechRate,
    pauseFrequency,
    fillerCount,
    totalDuration,
    transcript,
  };
}

function calculateSpeechRate(words: any[]): number {
  if (words.length === 0) return 0;

  const firstWord = words[0];
  const lastWord = words[words.length - 1];

  const startTime = parseFloat(firstWord.startTime.seconds || 0);
  const endTime = parseFloat(lastWord.endTime.seconds || 0);

  const duration = endTime - startTime;
  const moraCount = countMora(words.map(w => w.word).join(''));

  return moraCount / duration; // モーラ/秒
}

function calculatePauses(words: any[]): number {
  let pauseCount = 0;
  const PAUSE_THRESHOLD = 0.5; // seconds

  for (let i = 1; i < words.length; i++) {
    const prevEnd = parseFloat(words[i-1].endTime.seconds || 0);
    const currStart = parseFloat(words[i].startTime.seconds || 0);
    const gap = currStart - prevEnd;

    if (gap > PAUSE_THRESHOLD) {
      pauseCount++;
    }
  }

  const totalMinutes = parseFloat(words[words.length-1].endTime.seconds || 0) / 60;
  return pauseCount / totalMinutes; // ポーズ/分
}

function countFillers(transcript: string): number {
  const fillerWords = ['あの', 'えっと', 'まあ', 'そう', 'なんか', 'あー', 'えー'];
  let count = 0;

  fillerWords.forEach(filler => {
    const regex = new RegExp(filler, 'g');
    const matches = transcript.match(regex);
    count += matches ? matches.length : 0;
  });

  return count;
}

function countMora(text: string): number {
  // Simplified mora counting
  // Production should use proper Japanese NLP library
  return text.length; // Approximation
}
```

### Alternative Services

#### Azure Speech Service
```typescript
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_KEY,
  process.env.AZURE_REGION
);
speechConfig.speechRecognitionLanguage = 'ja-JP';
```

#### AWS Transcribe
```typescript
import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';

const client = new TranscribeClient({ region: 'ap-northeast-1' });
const command = new StartTranscriptionJobCommand({
  TranscriptionJobName: `interview-${interviewId}`,
  LanguageCode: 'ja-JP',
  MediaFormat: 'mp4',
  Media: {
    MediaFileUri: videoUrl,
  },
});
```

## 📈 Future Enhancements

### Advanced Metrics
1. **Pronunciation Accuracy**
   - Score pronunciation of Japanese words
   - Identify commonly mispronounced words

2. **Emotion Detection**
   - Analyze tone and emotion
   - Confidence level detection
   - Engagement scoring

3. **Content Analysis**
   - Keyword extraction
   - Topic modeling
   - Answer relevance scoring

4. **Visual Analysis**
   - Facial expression analysis
   - Eye contact tracking
   - Body language assessment

### Visualization
1. **Timeline View**
   - Visual timeline of speech patterns
   - Clickable segments
   - Speed variation graph

2. **Word Cloud**
   - Most frequently used words
   - Filler word heatmap

3. **Comparison Mode**
   - Compare multiple interviews
   - Progress tracking over time
   - Benchmark against industry standards

### Export & Sharing
1. **PDF Reports**
   - Comprehensive analysis report
   - Charts and graphs
   - Recommendations

2. **Video Annotations**
   - Timestamp markers
   - Problem areas highlighted
   - Feedback overlays

## 📚 Related Documentation

- `VIDEO_REVIEW_SYSTEM.md` - Video playback for interviewers
- `REQUEST_APPROVAL_SYSTEM.md` - Interview booking workflow
- `DATABASE_SETUP.md` - Database schema

## 🎓 Best Practices

### For MVP (Mock Analysis)
1. **Use realistic ranges** for scores
2. **Provide meaningful feedback** even with mock data
3. **Log all operations** for debugging
4. **Handle errors gracefully**

### For Production
1. **Use queue system** (Bull, BullMQ) for analysis jobs
2. **Implement retry logic** for failed analyses
3. **Store raw transcripts** for future reanalysis
4. **Cache analysis results**
5. **Monitor API costs**
6. **Set timeouts** for long-running jobs

### For Users
1. **Encourage multiple takes** to improve scores
2. **Provide practice mode** before real interviews
3. **Show improvement trends** over time
4. **Offer detailed explanations** of metrics

## 📊 Benchmarks & Standards

### Japanese Speech Benchmarks

| Metric | Beginner (N5-N4) | Intermediate (N3-N2) | Advanced (N1) |
|--------|------------------|---------------------|---------------|
| Speech Rate | 2.5-3.0 | 3.0-3.5 | 3.5-4.0 |
| Pause Frequency | 10-15 | 7-10 | 5-7 |
| Filler Count/min | 2.0+ | 1.0-2.0 | <1.0 |
| Overall Score | 1.0-2.5 | 2.5-3.5 | 3.5-5.0 |

### Interview-Specific Adjustments

- **IT Positions**: Technical terms allowed, slightly slower OK
- **営業 Positions**: Higher speech rate preferred, fewer pauses
- **事務 Positions**: Clear pronunciation prioritized, moderate pace
