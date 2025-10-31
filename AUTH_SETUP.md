# Authentication Setup - Do Jo Platform

This document describes the complete NextAuth.js authentication system for the Do Jo platform.

## ✅ Completed Features

### 1. Core Authentication
- ✅ NextAuth.js with Credentials provider
- ✅ JWT session strategy
- ✅ Password hashing with bcrypt
- ✅ Email/password authentication
- ✅ User type-based routing (Candidate, Interviewer, Admin)

### 2. Pages Created
- ✅ Login page with form validation
- ✅ Registration page with:
  - User type selection (Candidate/Interviewer)
  - Japanese level selection for candidates
  - Email marketing consent for candidates
  - Password strength validation
- ✅ Unauthorized access page

### 3. Route Protection
- ✅ Middleware for authentication
- ✅ Role-based access control
- ✅ Automatic redirects based on user type
- ✅ Protected routes for candidates, interviewers, and admins

## 📁 Files Created

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx              ✅ Login page with form
│   └── register/
│       └── page.tsx              ✅ Registration page
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts          ✅ NextAuth API route
│       └── register/
│           └── route.ts          ✅ Registration API
├── unauthorized/
│   └── page.tsx                  ✅ Unauthorized page
└── layout.tsx                    ✅ Updated with SessionProvider

lib/
├── auth.ts                       ✅ NextAuth configuration
└── auth-helpers.ts               ✅ Server-side auth utilities

components/
└── SessionProvider.tsx           ✅ Client-side session provider

types/
└── auth.ts                       ✅ TypeScript types

middleware.ts                     ✅ Route protection middleware

.env                              ✅ Updated with NextAuth secret
```

## 🔐 Authentication Flow

### Login Flow
1. User visits `/login`
2. Enters email and password
3. Form validates input with Zod schema
4. Submits to NextAuth credentials provider
5. NextAuth verifies against database
6. JWT token is created and stored in session
7. Middleware redirects based on user type:
   - Candidates → `/candidate/dashboard`
   - Interviewers → `/interviewer/dashboard`
   - Admins → `/admin/dashboard`

### Registration Flow
1. User visits `/register`
2. Selects user type (Candidate/Interviewer)
3. Fills in required fields:
   - Name, email, password
   - Japanese level (if candidate)
   - Marketing consent (if candidate)
4. Form validates with Zod schema
5. Submits to `/api/auth/register`
6. API creates user with hashed password
7. Creates usage tracking for candidates
8. Redirects to `/login?registered=true`

### Route Protection
1. Middleware checks all routes
2. Unauthenticated users → `/login`
3. Authenticated users:
   - Root `/` → Dashboard based on user type
   - Wrong role → `/unauthorized`
4. Public routes: `/login`, `/register`, `/api/auth/*`

## 🛠️ Configuration

### Environment Variables

```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="1a0fXFAAtYYQJeTKz69mgvKa9hb/2nJHaAtmKSv8vE8="

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/do_jo_db"
```

### NextAuth Options (`lib/auth.ts`)

```typescript
- Provider: Credentials (email/password)
- Session: JWT strategy
- Pages: Custom login/signout pages
- Callbacks: Include userId and userType in session
```

## 🔧 Usage Examples

### Client-Side (React Components)

```typescript
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <button onClick={() => signIn()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome {session.user.name}!</p>
      <p>User Type: {session.user.userType}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Server-Side (Server Components & API Routes)

```typescript
import { getSession, getCurrentUser, requireAuth } from "@/lib/auth-helpers";

// Get current session
const session = await getSession();

// Get current user
const user = await getCurrentUser();

// Require authentication (throws if not authenticated)
const session = await requireAuth();

// Check user type
import { isCandidate, isInterviewer, isAdmin } from "@/lib/auth-helpers";

if (await isCandidate()) {
  // Candidate-only logic
}
```

## 🧪 Test Credentials

After seeding the database, use these credentials:

### Candidates
```
Email: candidate1@dojo.com
Password: candidate123
Japanese Level: N3
```

```
Email: candidate2@dojo.com
Password: candidate123
Japanese Level: N2
```

### Interviewers
```
Email: interviewer1@dojo.com
Password: interviewer123
Specialty: IT
```

```
Email: interviewer2@dojo.com
Password: interviewer123
Specialty: Sales/Admin
```

### Admin
```
Email: admin@dojo.com
Password: admin123
```

## 🚀 Getting Started

### 1. Ensure Database is Set Up

```bash
# Run migrations (if not already done)
npx prisma migrate dev --name init

# Seed database with test users
npm run prisma:seed
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Authentication

Visit http://localhost:3000

**Try the flows:**
1. Visit root `/` → Redirects to `/login`
2. Login with test credentials
3. Auto-redirect to appropriate dashboard
4. Try accessing wrong routes (e.g., candidate accessing `/interviewer`)
5. Logout and try registration flow

## 🔒 Security Features

### Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, and numbers
- Hashed with bcrypt (10 rounds)

### Session Security
- JWT tokens with secure secret
- HTTP-only cookies (managed by NextAuth)
- Session expires on browser close (by default)

### Route Protection
- Middleware validates all routes
- Role-based access control
- Automatic redirects for unauthorized access

## 📝 Type Safety

All authentication types are defined in `types/auth.ts`:

```typescript
- LoginFormData
- RegisterFormData
- AuthUser
- AuthResponse
```

NextAuth types are extended in `lib/auth.ts` to include:
- `session.user.id`
- `session.user.userType`
- `session.user.japaneseLevel`

## 🎨 UI Features

### Login Page
- Email and password fields
- Remember me checkbox
- Forgot password link
- Link to registration
- Test credentials display
- Loading state during authentication

### Registration Page
- User type selection (visual cards)
- Conditional Japanese level field
- Password confirmation
- Marketing consent checkbox
- Terms and privacy policy links
- Password strength requirements

### Form Validation
- Zod schemas for type-safe validation
- React Hook Form for form management
- Real-time error messages
- Client-side and server-side validation

## 🐛 Troubleshooting

### "Invalid credentials" error
- Check database is running and seeded
- Verify DATABASE_URL in .env
- Ensure password matches seeded data

### Redirect loop
- Clear browser cookies
- Check NEXTAUTH_URL matches your domain
- Verify middleware matcher patterns

### TypeScript errors
- Run `npm run build` to check for errors
- Ensure Prisma client is generated
- Check import paths use `@/` alias

## 📚 Next Steps

### Recommended Enhancements
1. Add "Forgot Password" functionality
2. Implement email verification
3. Add OAuth providers (Google, LinkedIn)
4. Add two-factor authentication
5. Implement rate limiting
6. Add session management (view active sessions)
7. Add account deletion feature

### Integration Points
- Connect with candidate dashboard
- Connect with interviewer dashboard
- Add profile management pages
- Implement usage tracking display

## 🔗 References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
