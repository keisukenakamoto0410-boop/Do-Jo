# Prisma Schema Documentation

This document describes the database schema for the Do Jo platform.

## Database Models

### 1. User
The central user model supporting three user types: CANDIDATE, INTERVIEWER, and ADMIN.

**Fields:**
- `id` - UUID primary key
- `email` - Unique email address
- `password` - Hashed password (bcrypt)
- `name` - User's full name
- `userType` - CANDIDATE | INTERVIEWER | ADMIN
- `japaneseLevel` - N1 | N2 | N3 | N4 | N5 (optional, for candidates)
- `profile` - JSON field for additional flexible data
- `createdAt`, `updatedAt` - Timestamps

**Relations:**
- Has many Resumes
- Has many InterviewSlots (as interviewer)
- Has many Interviews (as candidate or interviewer)
- Has many Evaluations (as interviewer)
- Has many UsageTracking records

### 2. Resume
Stores candidate resume files uploaded to S3.

**Fields:**
- `id` - UUID primary key
- `userId` - Foreign key to User
- `fileUrl` - S3 URL to the resume file
- `fileName` - Original file name
- `uploadedAt` - Upload timestamp
- `isLatest` - Boolean flag for the most recent resume

**Relations:**
- Belongs to User

### 3. InterviewSlot
Available time slots created by interviewers.

**Fields:**
- `id` - UUID primary key
- `interviewerId` - Foreign key to User (interviewer)
- `startTime` - Slot start time
- `endTime` - Slot end time
- `status` - AVAILABLE | BOOKED | CANCELLED
- `jobCategory` - Job category (営業, IT, 事務, etc.)

**Relations:**
- Belongs to User (interviewer)
- Has many Interviews

### 4. Interview
Represents a scheduled or completed interview session.

**Fields:**
- `id` - UUID primary key
- `candidateId` - Foreign key to User (candidate)
- `interviewerId` - Foreign key to User (interviewer)
- `slotId` - Foreign key to InterviewSlot
- `videoUrl` - S3 URL to recorded video (nullable)
- `status` - SCHEDULED | COMPLETED | CANCELLED
- `scheduledAt` - Scheduled date/time
- `conductedAt` - Actual completion time (nullable)
- `createdAt` - Creation timestamp

**Relations:**
- Belongs to User (candidate)
- Belongs to User (interviewer)
- Belongs to InterviewSlot
- Has one Evaluation
- Has one FluencyAnalysis

### 5. Evaluation
Interview evaluation by interviewer with 18 criteria scores.

**Fields:**
- `id` - UUID primary key
- `interviewId` - Foreign key to Interview (unique)
- `interviewerId` - Foreign key to User (interviewer)
- `scores` - JSON containing all 18 evaluation items
- `comments` - Detailed comments (TEXT)
- `advice` - Advice for improvement (TEXT)
- `encouragementMessage` - Encouragement message (TEXT)
- `submittedAt` - Submission timestamp

**JSON Structure for scores:**
```json
{
  "appearance": 5,
  "greeting": 4,
  "posture": 5,
  "eyeContact": 4,
  "facialExpression": 5,
  "listening": 4,
  "questionUnderstanding": 5,
  "responseRelevance": 4,
  "logicalThinking": 4,
  "vocabularyRichness": 3,
  "grammarAccuracy": 4,
  "pronunciation": 4,
  "naturalness": 3,
  "politeness": 5,
  "clarityOfIntent": 4,
  "enthusiasm": 5,
  "cooperativeness": 4,
  "flexibility": 4
}
```

**Relations:**
- Belongs to Interview (one-to-one)
- Belongs to User (interviewer)

### 6. FluencyAnalysis
AI-generated fluency analysis of candidate's speech.

**Fields:**
- `id` - UUID primary key
- `interviewId` - Foreign key to Interview (unique)
- `speechRate` - Speech rate (モーラ数/秒)
- `pauseFrequency` - Pause frequency (ポーズ数/分)
- `fillerCount` - Count of filler words (あの、えっと, etc.)
- `totalDuration` - Total speech duration in seconds
- `overallScore` - Overall fluency score (1-5)
- `analyzedAt` - Analysis timestamp

**Relations:**
- Belongs to Interview (one-to-one)

### 7. UsageTracking
Tracks candidate's monthly interview usage against their limit.

**Fields:**
- `id` - UUID primary key
- `candidateId` - Foreign key to User (candidate)
- `month` - First day of the month (DateTime)
- `usageCount` - Number of interviews used (default: 0)
- `limit` - Monthly limit (default: 2)

**Relations:**
- Belongs to User (candidate)

**Unique Constraint:** One record per candidate per month

## Database Setup

### 1. Configure Environment
Copy `.env.example` to `.env` and set your DATABASE_URL:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/do_jo_db?schema=public"
```

### 2. Create and Apply Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Or push schema without migration (dev only)
npm run prisma:push
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Seed the Database

```bash
npm run prisma:seed
```

This creates:
- Admin user: `admin@dojo.com` / `admin123`
- Interviewer: `interviewer@dojo.com` / `interviewer123`
- Candidate: `candidate@dojo.com` / `candidate123`
- 5 sample interview slots
- Usage tracking for the candidate

### 5. Open Prisma Studio

```bash
npm run prisma:studio
```

Browse and edit your data at http://localhost:5555

## Usage in Code

Import the Prisma client from the utility file:

```typescript
import { prisma } from "@/lib/prisma";

// Example: Get all candidates
const candidates = await prisma.user.findMany({
  where: { userType: "CANDIDATE" },
  include: {
    resumes: true,
    interviewsAsCandidate: true,
  },
});

// Example: Create an interview
const interview = await prisma.interview.create({
  data: {
    candidateId: "user-uuid",
    interviewerId: "interviewer-uuid",
    slotId: "slot-uuid",
    scheduledAt: new Date(),
    status: "SCHEDULED",
  },
});
```

## Indexes

The schema includes strategic indexes for:
- User lookups by email and userType
- Resume queries by userId and latest status
- InterviewSlot filtering by status, time, and category
- Interview queries by candidate, interviewer, and status
- Evaluation and analysis lookups
- UsageTracking queries by candidate and month

## Cascading Deletes

When a User is deleted:
- All their Resumes are deleted
- All their InterviewSlots are deleted
- All their Interviews (as candidate or interviewer) are deleted
- All their Evaluations are deleted
- All their UsageTracking records are deleted

When an Interview is deleted:
- The associated Evaluation is deleted
- The associated FluencyAnalysis is deleted

## Notes

- All IDs use UUIDs for better security and distribution
- Timestamps use `@default(now())` and `@updatedAt`
- JSON fields provide flexibility for future extensions
- The schema follows PostgreSQL best practices
