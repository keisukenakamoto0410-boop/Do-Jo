# Interview Request & Approval System

Complete request/approval workflow for interview bookings with video upload functionality.

## Overview

This system implements a comprehensive workflow where:
1. Candidates submit booking **requests** (not immediate bookings)
2. Interviewers review and approve/reject requests
3. Approved interviews can have videos uploaded
4. Usage limits are enforced only on approval

## ✅ Features Implemented

### 1. Request Submission (Candidate)
- Submit booking request for available slots
- Request status: PENDING
- Notification sent to interviewer
- No usage count deduction until approved
- Slot remains AVAILABLE until approval

### 2. Request Management (Interviewer)
- View all requests (Pending, Approved, Rejected)
- Approve requests with one click
- Reject requests with required reason
- Resume preview link for each candidate
- Tabbed interface for filtering

### 3. Video Upload (Candidate)
- Upload interview videos (MP4, MOV, AVI, WEBM)
- Drag & drop interface
- Progress tracking
- File validation (type, size max 500MB)
- Video preview before upload
- Auto-mark interview as COMPLETED

### 4. Status Flow
```
PENDING → (Approve) → SCHEDULED → (Upload Video) → COMPLETED
        ↓
     (Reject) → REJECTED
```

## 📁 Files Created/Modified

### API Routes

```
app/api/
├── interview/
│   ├── approve/
│   │   └── route.ts              ✅ Approve booking request
│   ├── reject/
│   │   └── route.ts              ✅ Reject booking request
│   ├── book/
│   │   └── route.ts              🔄 Updated to use PENDING status
│   └── [interviewId]/
│       ├── route.ts              ✅ Get interview details
│       └── upload-video/
│           └── route.ts          ✅ Upload interview video
└── interviewer/
    └── requests/
        └── route.ts              ✅ Get booking requests
```

### Pages

```
app/
├── interviewer/
│   ├── dashboard/
│   │   └── page.tsx              🔄 Updated with quick links
│   └── requests/
│       └── page.tsx              ✅ Request management page
└── candidate/
    └── interview/
        └── [interviewId]/
            └── upload/
                └── page.tsx      ✅ Video upload page
```

### Components

```
components/
├── interviewer/
│   └── RequestCard.tsx           ✅ Request display & actions
└── interview/
    └── VideoUploader.tsx         ✅ Drag & drop uploader
```

### Libraries

```
lib/
└── upload-helpers.ts             ✅ Video upload utilities
```

### Database

```prisma
enum InterviewStatus {
  PENDING      ✅ New
  SCHEDULED
  COMPLETED
  CANCELLED
  REJECTED     ✅ New
}
```

## 🔧 API Endpoints

### Approve Request

```
POST /api/interview/approve

Body:
{
  "interviewId": "uuid"
}

Response (Success):
{
  "success": true,
  "message": "面接リクエストを承認しました",
  "interview": {
    "id": "uuid",
    "status": "SCHEDULED",
    "candidate": { "name": "山田太郎" },
    "scheduledAt": "2024-11-01T10:00:00Z"
  }
}
```

**Actions Performed:**
1. Update interview status: PENDING → SCHEDULED
2. Mark slot as BOOKED
3. Increment candidate usage counter
4. Send confirmation email to candidate

### Reject Request

```
POST /api/interview/reject

Body:
{
  "interviewId": "uuid",
  "reason": "申し訳ございませんが..."
}

Response (Success):
{
  "success": true,
  "message": "面接リクエストを却下しました",
  "interview": {
    "id": "uuid",
    "status": "REJECTED",
    "candidate": { "name": "山田太郎" },
    "reason": "..."
  }
}
```

**Actions Performed:**
1. Update interview status: PENDING → REJECTED
2. Free up the slot (status → AVAILABLE)
3. Decrement usage counter (refund)
4. Send rejection email with reason

### Get Requests

```
GET /api/interviewer/requests?status={pending|scheduled|rejected|all}

Response:
{
  "success": true,
  "requests": [...],
  "count": 5,
  "counts": {
    "pending": 2,
    "scheduled": 10,
    "rejected": 1,
    "all": 13
  },
  "currentFilter": "pending"
}
```

### Upload Video

```
POST /api/interview/[interviewId]/upload-video

FormData:
{
  "video": File
}

Response (Success):
{
  "success": true,
  "message": "動画のアップロードが完了しました",
  "interview": {
    "id": "uuid",
    "status": "COMPLETED",
    "videoUrl": "/uploads/videos/...",
    "conductedAt": "2024-11-01T10:25:00Z"
  },
  "video": {
    "url": "/uploads/videos/...",
    "filename": "interview_123456_abc.mp4",
    "size": 52428800
  }
}
```

**Actions Performed:**
1. Validate video file (type, size)
2. Upload to /public/uploads/videos/
3. Update interview with videoUrl
4. Mark interview as COMPLETED
5. Set conductedAt timestamp
6. Notify interviewer

## 🎯 Usage Flow

### Candidate Journey

1. **Submit Request**
   - Browse available slots at `/candidate/book`
   - Click "予約する" on desired slot
   - Request submitted with status PENDING
   - Notification sent to interviewer

2. **Wait for Approval**
   - Check dashboard for request status
   - Receive email when approved or rejected

3. **Upload Video** (if approved)
   - Navigate to `/candidate/interview/[id]/upload`
   - Drag & drop video file or click to browse
   - Preview video before upload
   - Track upload progress
   - Complete upload

4. **Receive Evaluation**
   - Interviewer evaluates the video
   - Candidate receives feedback

### Interviewer Journey

1. **Receive Requests**
   - Dashboard shows pending request count
   - Navigate to `/interviewer/requests`
   - See all requests in tabbed interface

2. **Review Request**
   - View candidate information
   - Check Japanese level
   - Access resume (link)
   - See requested time slot

3. **Approve or Reject**
   - **Approve**: One-click approval
     - Slot becomes BOOKED
     - Candidate usage incremented
     - Confirmation sent
   - **Reject**: Provide reason
     - Slot freed up
     - Usage refunded
     - Reason sent to candidate

4. **Evaluate Video**
   - Receive notification when video uploaded
   - Watch video at interview details page
   - Submit evaluation

## 🔒 Validation & Security

### Booking Request
- ✅ Authentication required (CANDIDATE only)
- ✅ Slot availability check
- ✅ No double booking (includes PENDING)
- ✅ Past date validation
- ✅ Usage limit check (2/month)
- ✅ Atomic transaction

### Approval
- ✅ Authentication required (INTERVIEWER only)
- ✅ Ownership verification
- ✅ Status validation (must be PENDING)
- ✅ Atomic transaction (status + slot + usage)

### Rejection
- ✅ Authentication required (INTERVIEWER only)
- ✅ Ownership verification
- ✅ Reason required (non-empty)
- ✅ Status validation (must be PENDING)
- ✅ Atomic transaction (status + slot + usage refund)

### Video Upload
- ✅ Authentication required (CANDIDATE only)
- ✅ Ownership verification
- ✅ Interview must be SCHEDULED
- ✅ No duplicate uploads
- ✅ File type validation (.mp4, .mov, .avi, .webm)
- ✅ File size validation (max 500MB)
- ✅ Unique filename generation

## 📧 Email Notifications (Mocked)

All emails are currently mocked with console.log for MVP:

### 1. Request Notification (to Interviewer)
```
Subject: 新しい面接リクエスト
- Candidate name
- Requested date/time
- Job category
- Link to review
```

### 2. Approval Confirmation (to Candidate)
```
Subject: 面接予約完了のお知らせ
- Interview details
- Interviewer name
- Time and category
- Instructions
```

### 3. Rejection Notice (to Candidate)
```
Subject: 面接リクエスト却下のお知らせ
- Rejection reason
- Refund notice
- Encouragement to rebook
```

### 4. Video Upload Notice (to Interviewer)
```
Subject: 面接動画がアップロードされました
- Candidate information
- Video URL
- File size
- Request for evaluation
```

## 🎨 UI Components

### RequestCard Component

**Features:**
- Candidate information display
- Status badge (Pending/Approved/Rejected)
- Interview details
- Approve/Reject buttons (for PENDING)
- Confirmation dialogs
- Reject reason input

**Props:**
```typescript
interface RequestCardProps {
  request: {
    id: string;
    status: string;
    createdAt: string;
    scheduledAt: string;
    candidate: {
      id: string;
      name: string;
      email: string;
      japaneseLevel: string;
    };
    slot: {
      jobCategory: string;
      startTime: string;
      endTime: string;
    };
  };
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}
```

### VideoUploader Component

**Features:**
- Drag & drop upload area
- File browser fallback
- Client-side validation
- Video preview
- Upload progress bar
- File information display
- Cancel option

**Props:**
```typescript
interface VideoUploaderProps {
  interviewId: string;
  onUploadSuccess: (videoUrl: string) => void;
  onUploadError: (error: string) => void;
}
```

## 🗄️ Database Changes

### Interview Model

```prisma
model Interview {
  status        InterviewStatus @default(PENDING)  // Changed from SCHEDULED
  // ... other fields
}
```

### New Status Values

```prisma
enum InterviewStatus {
  PENDING      // New: Initial request state
  SCHEDULED    // Updated: After approval
  COMPLETED    // After video upload
  CANCELLED    // Manual cancellation
  REJECTED     // New: After rejection
}
```

## 📊 State Transitions

```
┌─────────┐
│ PENDING │ ← Candidate submits request
└────┬────┘
     │
     ├─(Approve)─→ ┌───────────┐
     │             │ SCHEDULED │
     │             └─────┬─────┘
     │                   │
     │          (Upload Video)
     │                   │
     │                   ↓
     │             ┌───────────┐
     │             │ COMPLETED │
     │             └───────────┘
     │
     └─(Reject)──→ ┌──────────┐
                   │ REJECTED │
                   └──────────┘
```

## 🔧 Configuration

### Video Upload Settings

```typescript
// In lib/upload-helpers.ts
const SUPPORTED_VIDEO_TYPES = [".mp4", ".mov", ".avi", ".webm"];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
```

### File Storage

**Current (MVP):**
- Local filesystem: `/public/uploads/videos/`
- Unique filenames: `{name}_{timestamp}_{random}.{ext}`

**Future:**
- S3 or cloud storage
- CDN integration
- Video transcoding

## 🚀 Migration Steps

1. **Update Schema**
   ```bash
   npx prisma migrate dev --name add_pending_rejected_status
   ```

2. **Generate Client**
   ```bash
   npx prisma generate
   ```

3. **Create Upload Directory**
   ```bash
   mkdir -p public/uploads/videos
   ```

4. **Test Workflow**
   - Submit request as candidate
   - Approve/reject as interviewer
   - Upload video as candidate

## 🧪 Testing

### Test Approval Flow
```bash
# 1. Login as candidate
candidate1@dojo.com / candidate123

# 2. Submit booking request
/candidate/book → Select slot → Submit

# 3. Login as interviewer
interviewer1@dojo.com / interviewer123

# 4. View requests
/interviewer/requests → Pending tab

# 5. Approve request
Click "承認" → Confirm

# 6. Verify
- Interview status: SCHEDULED
- Slot status: BOOKED
- Usage count: +1
```

### Test Rejection Flow
```bash
# After step 4 above:
# 5. Reject request
Click "却下" → Enter reason → Confirm

# 6. Verify
- Interview status: REJECTED
- Slot status: AVAILABLE
- Usage count: unchanged
```

### Test Video Upload
```bash
# 1. Login as candidate with SCHEDULED interview

# 2. Navigate to upload page
/candidate/interview/[id]/upload

# 3. Upload video
Drag & drop or select file → Upload

# 4. Verify
- Interview status: COMPLETED
- Video URL saved
- conductedAt timestamp set
```

## 🐛 Troubleshooting

### "Request already processed"
- Check interview status in database
- Verify not trying to approve/reject twice

### "File too large"
- Max size is 500MB
- Compress video before upload

### "Unsupported file type"
- Only .mp4, .mov, .avi, .webm supported
- Convert video format

### Video upload fails
- Check file permissions on /public/uploads/videos/
- Verify disk space available
- Check server timeout settings (may need to increase for large files)

## 🔮 Future Enhancements

1. **Chunked Upload**
   - Split large files into chunks
   - Resume interrupted uploads
   - Better progress tracking

2. **Video Processing**
   - Automatic transcoding
   - Thumbnail generation
   - Multiple quality versions

3. **Cloud Storage**
   - S3 integration
   - CDN for faster delivery
   - Automatic backup

4. **Advanced Filters**
   - Filter by date range
   - Filter by candidate Japanese level
   - Filter by job category

5. **Bulk Actions**
   - Approve multiple requests
   - Batch rejection
   - Export request list

6. **Analytics**
   - Approval rate tracking
   - Average response time
   - Request volume charts

## 📚 Related Documentation

- `AUTH_SETUP.md` - Authentication system
- `BOOKING_SYSTEM.md` - Original booking system
- `DATABASE_SETUP.md` - Database setup
- `prisma/README.md` - Schema documentation

## 🎓 Key Concepts

### Why PENDING Status?

The PENDING status allows interviewers to:
- Review candidate qualifications before committing
- Check their actual availability
- Prevent unwanted bookings
- Maintain quality control

### Why Refund on Rejection?

Rejecting a request refunds the usage count because:
- The interview never happened
- Candidate shouldn't be penalized
- Encourages rebooking
- Fair usage policy

### Why Transaction-Based?

All approval/rejection operations use transactions to ensure:
- Data consistency
- No partial updates
- Rollback on errors
- Race condition prevention
