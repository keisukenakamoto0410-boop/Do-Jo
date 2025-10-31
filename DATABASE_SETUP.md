# Database Setup Guide

This guide walks you through setting up the PostgreSQL database for the Do Jo platform.

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- npm or yarn package manager

## Step-by-Step Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE do_jo_db;

# Create user (optional, if you want a dedicated user)
CREATE USER dojo_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE do_jo_db TO dojo_user;

# Exit psql
\q
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file and update the `DATABASE_URL`:

```env
# For local development with default postgres user
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/do_jo_db?schema=public"

# Or with dedicated user
DATABASE_URL="postgresql://dojo_user:your_secure_password@localhost:5432/do_jo_db?schema=public"
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This command:
- Reads `prisma/schema.prisma`
- Generates TypeScript types and Prisma Client
- Installs the client in `node_modules/@prisma/client`

### 4. Create Initial Migration

```bash
npx prisma migrate dev --name init
```

This command:
- Creates a new migration file in `prisma/migrations/`
- Applies the migration to your database
- Automatically runs `prisma generate`
- Names the migration "init"

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "do_jo_db"

Applying migration `20231030_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20231030_init/
    └─ migration.sql

✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### 5. Seed the Database

```bash
npm run prisma:seed
```

This command creates test data:
- **1 Admin user**: admin@dojo.com / admin123
- **2 Interviewers**:
  - interviewer1@dojo.com / interviewer123 (IT specialist)
  - interviewer2@dojo.com / interviewer123 (Sales/Admin specialist)
- **3 Candidates**:
  - candidate1@dojo.com / candidate123 (N3 level, IT)
  - candidate2@dojo.com / candidate123 (N2 level, Sales)
  - candidate3@dojo.com / candidate123 (N4 level, Admin)
- **8 Interview slots** (4 per interviewer)
- **Usage tracking** for all candidates

**Expected output:**
```
🌱 Seeding database...
✅ Created admin user: admin@dojo.com
✅ Created interviewer 1: interviewer1@dojo.com
✅ Created interviewer 2: interviewer2@dojo.com
✅ Created candidate 1: candidate1@dojo.com
✅ Created candidate 2: candidate2@dojo.com
✅ Created candidate 3: candidate3@dojo.com
✅ Created 8 interview slots
✅ Created usage tracking for all candidates

🎉 Seeding completed successfully!
```

## Useful Commands

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

Opens a visual database browser at http://localhost:5555

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

This will:
- Drop the database
- Create a new database
- Apply all migrations
- Run the seed script

### Create New Migration

```bash
npx prisma migrate dev --name your_migration_name
```

### Push Schema Without Migration (Quick Development)

```bash
npm run prisma:push
```

**Warning:** This directly updates the database schema without creating migration files. Use only in development.

### Format Prisma Schema

```bash
npx prisma format
```

## Database Schema Overview

The database includes 7 main models:

1. **User** - Candidates, Interviewers, and Admins
2. **Resume** - Uploaded resume files
3. **InterviewSlot** - Available time slots
4. **Interview** - Scheduled/completed interviews
5. **Evaluation** - Interview feedback with 18 criteria
6. **FluencyAnalysis** - AI speech analysis
7. **UsageTracking** - Monthly usage limits

See `prisma/README.md` for detailed schema documentation.

## Using the Database in Your Code

Import the database client:

```typescript
// Using lib/db.ts
import { db } from "@/lib/db";

// Or using lib/prisma.ts
import { prisma } from "@/lib/prisma";

// Both export the same singleton instance
```

Example queries:

```typescript
// Get all candidates
const candidates = await db.user.findMany({
  where: { userType: "CANDIDATE" },
  include: {
    interviewsAsCandidate: true,
    resumes: true,
  },
});

// Create an interview
const interview = await db.interview.create({
  data: {
    candidateId: "uuid",
    interviewerId: "uuid",
    slotId: "uuid",
    scheduledAt: new Date(),
    status: "SCHEDULED",
  },
});

// Get user with evaluations
const interviewer = await db.user.findUnique({
  where: { email: "interviewer1@dojo.com" },
  include: {
    evaluations: {
      include: {
        interview: true,
      },
    },
  },
});
```

## Troubleshooting

### Connection Error

If you see:
```
Can't reach database server at `localhost:5432`
```

1. Check PostgreSQL is running: `pg_isready`
2. Verify connection details in `.env`
3. Test connection: `psql -U postgres -d do_jo_db`

### Migration Error

If migrations fail:
```bash
# Check migration status
npx prisma migrate status

# Mark migration as applied (if already applied manually)
npx prisma migrate resolve --applied "migration_name"
```

### Seed Error

If seeding fails:
```bash
# Reset and try again
npx prisma migrate reset

# Or manually run seed with verbose output
tsx prisma/seed.ts
```

## Production Deployment

For production:

1. Set `DATABASE_URL` in production environment
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. **DO NOT** run the seed script in production
4. Consider using connection pooling (e.g., PgBouncer)

## Next Steps

After setup:
1. Start the development server: `npm run dev`
2. Test login with the seeded credentials
3. Explore the database: `npm run prisma:studio`
4. Build your features using the Prisma Client

For more information, see `prisma/README.md`.
