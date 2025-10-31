# Database Setup Commands

This document provides the exact commands to set up your database for the Do Jo platform.

## ✅ Already Completed

The following have been set up for you:

1. ✅ Prisma Client generated
2. ✅ Prisma schema created (`prisma/schema.prisma`)
3. ✅ Seed script created (`prisma/seed.ts`)
4. ✅ Database utility created (`lib/db.ts`)
5. ✅ package.json configured with seed command
6. ✅ .env file created from template

## 🚀 Commands to Run

Follow these steps in order:

### Step 1: Set Up PostgreSQL Database

First, create a PostgreSQL database. Choose one of these methods:

#### Option A: Using createdb command (macOS/Linux)

```bash
# Create the database
createdb do_jo_db
```

#### Option B: Using psql

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE do_jo_db;

# Exit psql
\q
```

#### Option C: Using Docker (if you don't have PostgreSQL installed)

```bash
# Run PostgreSQL in Docker
docker run --name do-jo-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=do_jo_db \
  -p 5432:5432 \
  -d postgres:15
```

### Step 2: Update Database Connection String

Edit the `.env` file and update the `DATABASE_URL` with your PostgreSQL credentials:

```bash
# Open .env in your editor
nano .env
# or
code .env
# or
vim .env
```

Update this line:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/do_jo_db?schema=public"
```

**Common configurations:**

```env
# Default PostgreSQL user
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/do_jo_db?schema=public"

# Custom user
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/do_jo_db?schema=public"

# Docker PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/do_jo_db?schema=public"
```

### Step 3: Generate Prisma Client

```bash
npm run prisma:generate
```

**Expected output:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### Step 4: Create and Run Initial Migration

```bash
npx prisma migrate dev --name init
```

**What this does:**
- Creates a migration file in `prisma/migrations/`
- Applies the migration to your database
- Creates all tables, indexes, and constraints
- Automatically runs `prisma generate`

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "do_jo_db"

Applying migration `20241030_init`

The following migration(s) have been created and applied:

migrations/
  └─ 20241030_init/
    └─ migration.sql

✔ Generated Prisma Client
```

### Step 5: Seed the Database

```bash
npm run prisma:seed
```

**What this creates:**
- 1 Admin user
- 2 Interviewers
- 3 Candidates
- 8 Interview slots
- Usage tracking for all candidates

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

📝 Login credentials:
Admin:         admin@dojo.com / admin123
Interviewer 1: interviewer1@dojo.com / interviewer123
Interviewer 2: interviewer2@dojo.com / interviewer123
Candidate 1:   candidate1@dojo.com / candidate123
Candidate 2:   candidate2@dojo.com / candidate123
Candidate 3:   candidate3@dojo.com / candidate123
```

### Step 6: Verify Setup with Prisma Studio

```bash
npm run prisma:studio
```

This opens a visual database browser at http://localhost:5555 where you can:
- View all your tables
- Browse the seeded data
- Edit records
- Verify the database structure

## 📝 Test Credentials

After seeding, use these credentials to test your application:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| Admin | admin@dojo.com | admin123 | Full system access |
| Interviewer 1 | interviewer1@dojo.com | interviewer123 | 田中 太郎 - IT specialist |
| Interviewer 2 | interviewer2@dojo.com | interviewer123 | 佐藤 花子 - Sales/Admin specialist |
| Candidate 1 | candidate1@dojo.com | candidate123 | Rajesh Kumar - N3 level, IT |
| Candidate 2 | candidate2@dojo.com | candidate123 | Priya Sharma - N2 level, Sales |
| Candidate 3 | candidate3@dojo.com | candidate123 | Amit Patel - N4 level, Admin |

## 🔄 Reset Database (Development Only)

If you need to start fresh:

```bash
# This will drop the database, recreate it, run migrations, and seed
npx prisma migrate reset
```

**Warning:** This deletes all data!

## 📊 Database Summary

After running the migration, you'll have these tables:

- `users` - All user accounts (candidates, interviewers, admins)
- `resumes` - Uploaded resume files
- `interview_slots` - Available time slots
- `interviews` - Scheduled/completed interviews
- `evaluations` - Interview feedback with 18 criteria
- `fluency_analyses` - AI speech analysis results
- `usage_tracking` - Monthly usage limits

## 🛠️ Additional Useful Commands

### View migration status
```bash
npx prisma migrate status
```

### Format Prisma schema
```bash
npx prisma format
```

### Push schema changes (development only, no migration files)
```bash
npm run prisma:push
```

### Create a new migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Deploy migrations (production)
```bash
npx prisma migrate deploy
```

## 🚨 Troubleshooting

### "Can't reach database server"

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify connection string in `.env`

3. Test connection:
   ```bash
   psql -U postgres -d do_jo_db
   ```

### "Database does not exist"

Create it first:
```bash
createdb do_jo_db
```

### "Relation already exists"

Your database already has tables. Either:
- Drop and recreate: `npx prisma migrate reset`
- Or manually drop tables and run migration again

## 📚 Next Steps

After completing the setup:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000

3. Try logging in with the test credentials

4. Explore the database with Prisma Studio:
   ```bash
   npm run prisma:studio
   ```

5. Start building your features!

## 🔗 Documentation

- Full schema documentation: `prisma/README.md`
- Detailed setup guide: `DATABASE_SETUP.md`
- Environment variables: `.env.example`
