# Resume Management System

Complete resume upload and management functionality for candidate users.

## ✅ Features Implemented

### 1. File Upload with Drag & Drop
- ✅ Drag and drop interface
- ✅ Click to select file
- ✅ File type validation (PDF, DOCX)
- ✅ File size validation (5MB max)
- ✅ Real-time preview before upload
- ✅ Upload progress bar

### 2. Resume Management
- ✅ List all uploaded resumes
- ✅ Sort by upload date (newest first)
- ✅ "Latest" badge on current resume
- ✅ Preview resume (opens in new tab)
- ✅ Delete resume with confirmation
- ✅ Auto-mark newest as latest after deletion

### 3. Storage
- ✅ Local file storage in `/public/uploads/resumes/`
- ✅ Unique filename generation
- ✅ Automatic directory creation
- ✅ File cleanup on deletion
- ✅ Ready for S3 migration

## 📁 Files Created

```
app/
├── candidate/
│   └── resume/
│       └── page.tsx              ✅ Resume management page
└── api/
    └── resume/
        ├── upload/
        │   └── route.ts          ✅ Upload API
        ├── list/
        │   └── route.ts          ✅ List API
        └── [id]/
            └── route.ts          ✅ Get/Delete API

components/
└── candidate/
    └── ResumeUploader.tsx        ✅ Drag & drop uploader

lib/
└── storage.ts                    ✅ Storage utilities

public/
└── uploads/
    └── resumes/
        └── .gitkeep              ✅ Directory placeholder
```

## 🔧 API Endpoints

### Upload Resume
```
POST /api/resume/upload
Content-Type: multipart/form-data

Body:
- file: File (PDF or DOCX, max 5MB)

Response:
{
  "success": true,
  "message": "履歴書が正常にアップロードされました",
  "resume": {
    "id": "uuid",
    "fileName": "resume.pdf",
    "fileUrl": "/uploads/resumes/resume_1234567890_abc123.pdf",
    "uploadedAt": "2024-10-30T12:00:00Z",
    "isLatest": true
  }
}
```

### List Resumes
```
GET /api/resume/list

Response:
{
  "success": true,
  "resumes": [...],
  "count": 3
}
```

### Get Resume
```
GET /api/resume/{id}

Response:
{
  "success": true,
  "resume": {
    "id": "uuid",
    "fileName": "resume.pdf",
    "fileUrl": "/uploads/resumes/...",
    "uploadedAt": "2024-10-30T12:00:00Z",
    "isLatest": true
  }
}
```

### Delete Resume
```
DELETE /api/resume/{id}

Response:
{
  "success": true,
  "message": "履歴書が正常に削除されました"
}
```

## 🎨 UI Components

### ResumeUploader Component

**Props:**
- `onUploadSuccess: () => void` - Callback after successful upload

**Features:**
- Drag and drop zone
- File selection button
- File validation with error messages
- Preview selected file with name and size
- Upload progress bar
- Success/error notifications
- Cancel upload

**Usage:**
```tsx
import ResumeUploader from "@/components/candidate/ResumeUploader";

<ResumeUploader onUploadSuccess={() => {
  // Refresh resume list
  fetchResumes();
}} />
```

### Resume Page

**Route:** `/candidate/resume`

**Features:**
- Upload new resume section
- List of uploaded resumes
- Latest resume badge
- Preview and delete actions
- Empty state message
- Helpful tips section

## 🔒 Security

### Authentication
- ✅ All endpoints require authentication
- ✅ Only candidates can upload/manage resumes
- ✅ Users can only access their own resumes
- ✅ Interviewers/admins can view resumes

### Validation
- ✅ File type validation (client & server)
- ✅ File size validation (max 5MB)
- ✅ Unique filename generation
- ✅ Sanitized filenames (no special chars)

### Storage
- ✅ Files stored in isolated directory
- ✅ Unique filenames prevent collisions
- ✅ Files removed on deletion
- ✅ .gitignore prevents commit of uploads

## 💾 Storage Details

### Local Storage (MVP)

**Directory:** `/public/uploads/resumes/`

**Filename Format:**
```
{sanitized_name}_{timestamp}_{random_string}.{ext}

Example:
resume_1698765432000_a1b2c3d4e5f6g7h8.pdf
```

**Access:**
```
Public URL: /uploads/resumes/{filename}
Direct preview in browser for PDFs
```

### Future: S3 Migration

Storage utility includes placeholder functions for S3:
- `uploadToS3(file, userId)` - Upload to S3
- `generateSignedUrl(key)` - Generate signed URL

To migrate to S3:
1. Install AWS SDK: `npm install @aws-sdk/client-s3`
2. Implement S3 functions in `lib/storage.ts`
3. Update environment variables
4. Switch upload calls to use S3

## 🧪 Testing

### Manual Testing

1. **Upload Flow:**
   ```bash
   # Start server
   npm run dev

   # Login as candidate
   # Navigate to /candidate/resume
   # Try drag & drop
   # Try file selection
   # Upload various file types
   ```

2. **Test Cases:**
   - ✅ Upload valid PDF
   - ✅ Upload valid DOCX
   - ✅ Try to upload invalid file type (rejected)
   - ✅ Try to upload file >5MB (rejected)
   - ✅ Upload multiple resumes
   - ✅ Verify "Latest" badge
   - ✅ Preview resume
   - ✅ Delete resume
   - ✅ Verify new latest after deletion

3. **Edge Cases:**
   - Upload with special characters in filename
   - Upload with very long filename
   - Multiple uploads in succession
   - Delete while another upload in progress

## 📊 Database Schema

Resume model in `prisma/schema.prisma`:

```prisma
model Resume {
  id         String   @id @default(uuid())
  userId     String
  fileUrl    String
  fileName   String
  uploadedAt DateTime @default(now())
  isLatest   Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, isLatest])
  @@map("resumes")
}
```

## 🔄 File Upload Flow

1. **User selects/drops file**
   - Client validates type & size
   - Shows preview with file info

2. **User clicks upload**
   - Shows progress bar
   - Sends FormData to API

3. **Server receives request**
   - Validates authentication
   - Validates file type & size
   - Generates unique filename

4. **Server saves file**
   - Creates upload directory if needed
   - Writes file to disk
   - Returns public URL

5. **Server updates database**
   - Marks old resumes as not latest
   - Creates new resume record
   - Marks as latest

6. **Client receives response**
   - Shows success message
   - Refreshes resume list
   - Clears upload form

## 🎯 User Experience

### Upload States

1. **Empty State**
   - Shows drag & drop zone
   - No resumes uploaded yet
   - Helpful instructions

2. **File Selected**
   - Shows file preview
   - Displays name and size
   - Upload button enabled

3. **Uploading**
   - Progress bar animation
   - Upload button disabled
   - Cancel button hidden

4. **Success**
   - Green success message
   - Form clears automatically
   - Resume list refreshes

5. **Error**
   - Red error message
   - Form remains populated
   - User can retry

## 🚀 Usage Example

```typescript
// In a candidate component
"use client";

import { useState, useEffect } from "react";

export default function MyComponent() {
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    const response = await fetch("/api/resume/list");
    const data = await response.json();
    setResumes(data.resumes);
  };

  return (
    <div>
      {/* Show latest resume */}
      {resumes.find(r => r.isLatest) && (
        <a href={resumes.find(r => r.isLatest).fileUrl}>
          View Latest Resume
        </a>
      )}
    </div>
  );
}
```

## 📝 Environment Variables

No additional environment variables needed for local storage.

For S3 (future):
```env
AWS_REGION="ap-northeast-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET_NAME="do-jo-uploads"
```

## 🔧 Maintenance

### Clear Old Files

```bash
# Remove all uploaded resumes (be careful!)
rm -rf public/uploads/resumes/*
touch public/uploads/resumes/.gitkeep

# Also clear database records
# Use Prisma Studio or SQL
```

### Monitor Storage

```bash
# Check storage usage
du -sh public/uploads/resumes/

# Count files
ls -1 public/uploads/resumes/ | wc -l
```

## 🚧 Future Enhancements

### Planned Features
1. ✅ S3 integration
2. ✅ Image preview for document thumbnails
3. ✅ Bulk upload (multiple files)
4. ✅ Resume templates/builder
5. ✅ Version history
6. ✅ Resume parsing (extract info)
7. ✅ PDF generation from form
8. ✅ Share resume link with interviewers

### Technical Improvements
1. Add file compression
2. Add virus scanning
3. Add watermarking
4. Add download statistics
5. Add expiry dates for old resumes

## 🐛 Troubleshooting

### "Failed to upload"
- Check file size (must be under 5MB)
- Check file type (PDF or DOCX only)
- Verify authentication
- Check server logs

### "File not found"
- File may have been deleted
- Check `/public/uploads/resumes/` directory exists
- Verify file URL in database

### "Permission denied"
- Check directory permissions
- Ensure write access to `/public/uploads/`
- Check user is authenticated as candidate

## 📚 Related Documentation

- `AUTH_SETUP.md` - Authentication system
- `DATABASE_SETUP.md` - Database configuration
- `prisma/README.md` - Database schema

## 🎓 Learning Resources

- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#formdata)
- [Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [AWS S3 SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
