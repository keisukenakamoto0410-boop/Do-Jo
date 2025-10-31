# Interview Booking System

Complete interview booking system for candidates to schedule interviews with available interviewers.

## ✅ Features Implemented

### 1. Booking Page
- ✅ Calendar view with available dates
- ✅ Interactive date selection
- ✅ Filter by job category (IT, 営業, 事務, その他)
- ✅ Filter by interviewer
- ✅ Slot cards with detailed information
- ✅ Real-time availability check

### 2. Usage Limits
- ✅ 2 interviews per month limit
- ✅ Automatic tracking per candidate
- ✅ Month-based reset
- ✅ Usage counter display

### 3. Booking Validation
- ✅ Prevent double booking
- ✅ Check slot availability
- ✅ Verify usage limits
- ✅ Validate past dates
- ✅ Transaction-based booking (atomic)

### 4. Email Notifications (Mocked)
- ✅ Confirmation email to candidate
- ✅ Notification to interviewer
- ✅ Console logging for MVP
- ✅ Ready for SendGrid integration

## 📁 Files Created

```
app/
├── candidate/
│   └── book/
│       └── page.tsx              ✅ Booking page with filters
└── api/
    ├── interview-slots/
    │   └── available/
    │       └── route.ts          ✅ Get available slots
    └── interview/
        └── book/
            └── route.ts          ✅ Book interview

components/
└── candidate/
    ├── BookingCalendar.tsx       ✅ Interactive calendar
    └── SlotCard.tsx              ✅ Slot display & booking

lib/
└── email.ts                      ✅ Email utilities (mocked)
```

## 🎨 UI Components

### BookingCalendar Component

**Features:**
- Month navigation
- Available date highlighting (green)
- Selected date highlighting (blue)
- Past dates disabled (gray)
- Today indicator
- Legend for date colors

**Props:**
```typescript
interface BookingCalendarProps {
  availableDates: string[];       // ISO date strings
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}
```

### SlotCard Component

**Features:**
- Date and time display (Japanese format)
- Duration calculation
- Interviewer information
- Expertise tags
- Job category badge with icon
- Booking button
- Confirmation dialog
- Loading states
- Error handling

**Props:**
```typescript
interface SlotCardProps {
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    jobCategory: string;
    interviewer: {
      id: string;
      name: string;
      expertise: string[];
      bio: string;
    };
  };
  onBookSuccess: () => void;
}
```

## 🔧 API Endpoints

### Get Available Slots

```
GET /api/interview-slots/available

Query Parameters:
- startDate: ISO date string (optional, defaults to today)
- endDate: ISO date string (optional)
- category: string (optional: IT, 営業, 事務, その他)
- interviewerId: string (optional)

Response:
{
  "success": true,
  "slots": [
    {
      "id": "uuid",
      "startTime": "2024-11-01T10:00:00Z",
      "endTime": "2024-11-01T10:20:00Z",
      "jobCategory": "IT",
      "interviewer": {
        "id": "uuid",
        "name": "田中 太郎",
        "expertise": ["IT", "エンジニア"],
        "bio": "10年以上の面接官経験..."
      }
    }
  ],
  "count": 10
}
```

### Book Interview

```
POST /api/interview/book

Body:
{
  "slotId": "uuid"
}

Response (Success):
{
  "success": true,
  "message": "面接の予約が完了しました",
  "interview": {
    "id": "uuid",
    "scheduledAt": "2024-11-01T10:00:00Z",
    "interviewer": {
      "name": "田中 太郎"
    },
    "jobCategory": "IT"
  },
  "usage": {
    "used": 1,
    "limit": 2,
    "remaining": 1
  }
}

Response (Error - Limit Reached):
{
  "error": "今月の利用制限に達しています（2回/月）"
}

Response (Error - Already Booked):
{
  "error": "このスロットは既に予約されています"
}
```

## 🔒 Booking Validation

### 1. Authentication Check
- User must be logged in
- User must be a CANDIDATE type

### 2. Slot Validation
- Slot must exist
- Slot status must be AVAILABLE
- Slot must not have existing interviews
- Slot must not be in the past

### 3. Usage Limit Check
- Check current month's usage
- Create tracking if doesn't exist
- Verify usage < limit (2 per month)

### 4. Transaction Safety
All booking operations wrapped in database transaction:
1. Check slot availability
2. Check usage limit
3. Create interview record
4. Update slot status to BOOKED
5. Increment usage counter

If any step fails, entire transaction rolls back.

## 📊 Database Flow

### Booking Process

```sql
BEGIN TRANSACTION;

-- 1. Check slot
SELECT * FROM interview_slots WHERE id = ? AND status = 'AVAILABLE';

-- 2. Check existing interviews
SELECT * FROM interviews WHERE slotId = ? AND status IN ('SCHEDULED', 'COMPLETED');

-- 3. Check/Create usage tracking
SELECT * FROM usage_tracking WHERE candidateId = ? AND month = ?;

-- 4. Verify limit
IF usageCount >= limit THEN ROLLBACK;

-- 5. Create interview
INSERT INTO interviews (...) VALUES (...);

-- 6. Update slot
UPDATE interview_slots SET status = 'BOOKED' WHERE id = ?;

-- 7. Increment usage
UPDATE usage_tracking SET usageCount = usageCount + 1 WHERE ...;

COMMIT;
```

## 🎯 Usage Flow

### Candidate Journey

1. **Navigate to Booking Page**
   - Visit `/candidate/book`
   - See calendar and available slots

2. **Apply Filters**
   - Select job category (IT, 営業, etc.)
   - Choose preferred interviewer
   - Click date on calendar

3. **View Available Slots**
   - See filtered slots
   - View interviewer details
   - Check time and duration

4. **Book Interview**
   - Click "予約する" button
   - Review details in dialog
   - Confirm booking

5. **Receive Confirmation**
   - Success message displayed
   - Email sent (mocked)
   - Slots refresh automatically

## 🔄 State Management

### Page State
```typescript
- slots: Slot[]                    // All fetched slots
- filteredSlots: Slot[]            // After applying filters
- interviewers: Interviewer[]      // Unique interviewers
- selectedDate: Date | null        // Calendar selection
- selectedCategory: string         // Filter state
- selectedInterviewer: string      // Filter state
- isLoading: boolean               // Loading state
- error: string                    // Error message
- showSuccess: boolean             // Success flag
```

### Filter Logic
1. Start with all slots
2. Filter by selected date (if any)
3. Filter by category (if not "all")
4. Filter by interviewer (if not "all")
5. Update filtered slots

## 📧 Email Notifications

### Current Implementation (Mocked)

All email functions log to console for MVP:

```typescript
// Booking confirmation
sendBookingConfirmationEmail({
  candidate: { email, name },
  interviewer: { email, name },
  slot: { startTime, endTime, jobCategory }
});

// Interviewer notification
sendInterviewerNotificationEmail({...});

// Reminder (24h before)
sendInterviewReminderEmail({
  email, name, interviewTime
});

// Cancellation
sendCancellationEmail({
  email, name, interviewTime, reason
});
```

### Future SendGrid Integration

```typescript
// Install SendGrid
npm install @sendgrid/mail

// Configure in .env
SENDGRID_API_KEY="your-key"
SENDGRID_FROM_EMAIL="noreply@dojo-platform.com"

// Implement in lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: data.candidate.email,
  from: process.env.SENDGRID_FROM_EMAIL!,
  subject: '面接予約完了のお知らせ',
  html: generateBookingEmailHtml(data),
});
```

## 🧪 Testing

### Manual Testing

1. **Book Interview Flow**
   ```bash
   # Login as candidate
   candidate1@dojo.com / candidate123

   # Navigate to booking
   /candidate/book

   # Test filters
   - Select category
   - Select interviewer
   - Click dates

   # Test booking
   - Click "予約する"
   - Confirm dialog
   - Check success message
   ```

2. **Usage Limit Test**
   ```bash
   # Book first interview (should succeed)
   # Book second interview (should succeed)
   # Try third interview (should fail with limit error)
   ```

3. **Double Booking Prevention**
   ```bash
   # Book a slot
   # Try booking same slot again (should fail)
   # Refresh page
   # Verify slot no longer appears
   ```

### Test Cases

- ✅ Display available slots
- ✅ Filter by category
- ✅ Filter by interviewer
- ✅ Filter by date
- ✅ Book interview successfully
- ✅ Prevent booking past dates
- ✅ Prevent double booking
- ✅ Enforce usage limit (2/month)
- ✅ Show error for limit reached
- ✅ Transaction rollback on error
- ✅ Calendar navigation
- ✅ Available date highlighting
- ✅ Confirmation dialog
- ✅ Success message
- ✅ Auto-refresh after booking

## 🔐 Security

### Access Control
- ✅ Authentication required
- ✅ Candidate-only access
- ✅ User ownership verification

### Data Validation
- ✅ Slot ID validation
- ✅ Date validation (no past dates)
- ✅ Availability check
- ✅ Usage limit enforcement

### Race Condition Prevention
- ✅ Database transactions
- ✅ Atomic operations
- ✅ Lock on slot during booking
- ✅ Re-check availability before commit

## 📱 Responsive Design

- ✅ Mobile-friendly layout
- ✅ Responsive grid (1 col mobile, 3 cols desktop)
- ✅ Touch-friendly buttons
- ✅ Scrollable slot list
- ✅ Modal dialogs

## 🎨 UI/UX Features

### Visual Feedback
- Loading spinners
- Success/error messages
- Disabled states
- Hover effects
- Color-coded categories

### Icons
- 💻 IT
- 💼 営業
- 📋 事務
- 🔖 その他
- 👔 Interviewer
- 📅 Calendar

### Colors
- Primary Blue: Actions, selected states
- Green: Available dates, success
- Red: Errors
- Gray: Disabled, past dates

## 🚀 Usage Examples

### Get Slots for Next Week

```typescript
const startDate = new Date();
const endDate = new Date();
endDate.setDate(endDate.getDate() + 7);

const response = await fetch(
  `/api/interview-slots/available?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
);
```

### Book Interview

```typescript
const response = await fetch('/api/interview/book', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ slotId: 'slot-uuid' })
});

const data = await response.json();
if (data.success) {
  console.log('Booked!', data.usage);
}
```

## 🔧 Configuration

### Usage Limits

Change in `prisma/seed.ts`:
```typescript
await prisma.usageTracking.create({
  data: {
    candidateId: candidate.id,
    month: currentMonth,
    usageCount: 0,
    limit: 2,  // Change this value
  },
});
```

### Job Categories

Update categories in page:
```typescript
const categories = ["all", "IT", "営業", "事務", "その他"];
```

## 🐛 Troubleshooting

### "No slots available"
- Check database has interview slots
- Verify slot status is AVAILABLE
- Check date range
- Verify slots are in future

### "Usage limit reached"
- Check UsageTracking table
- Verify month is current
- Reset count if needed:
  ```sql
  UPDATE usage_tracking
  SET usageCount = 0
  WHERE candidateId = ?;
  ```

### "Slot already booked"
- Refresh page
- Check Interview table for existing booking
- Verify slot status in database

## 📚 Related Documentation

- `AUTH_SETUP.md` - Authentication
- `DATABASE_SETUP.md` - Database setup
- `prisma/README.md` - Schema documentation

## 🔮 Future Enhancements

1. **Cancellation System**
   - Allow candidates to cancel
   - Refund usage count
   - Mark slot as available

2. **Rescheduling**
   - Move to different slot
   - Don't count as new booking

3. **Waitlist**
   - Join waitlist for full slots
   - Auto-book if slot opens

4. **Calendar Integration**
   - Export to Google Calendar
   - Add to iCal

5. **Video Integration**
   - Zoom/Google Meet links
   - In-platform video

6. **Automated Reminders**
   - Email 24h before
   - Email 1h before
   - SMS notifications

7. **Interviewer Availability**
   - Bulk slot creation
   - Recurring availability
   - Blackout dates

8. **Advanced Filtering**
   - Skill matching
   - Language preferences
   - Time zone conversion

## 🎓 Learning Resources

- [Date Handling in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [React useState Hook](https://react.dev/reference/react/useState)
- [Database Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
