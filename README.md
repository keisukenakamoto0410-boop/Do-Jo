# Do Jo - Japanese Interview Practice Platform

A comprehensive interview practice platform designed for foreign learners (primarily Indian Japanese learners) to improve their Japanese language skills and interview performance.

## Features

- **Candidate Portal**: Practice interviews, view feedback, track progress
- **Interviewer Portal**: Conduct interviews, provide feedback, manage sessions
- **Video Recording**: Record and review interview sessions
- **Resume Management**: Upload and manage resumes
- **Authentication**: Secure login with NextAuth.js
- **Multilingual**: Support for English and Japanese

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Storage**: AWS S3 (for videos and resumes)
- **Email**: SendGrid

## Project Structure

```
do-jo/
├── app/
│   ├── (auth)/             # Authentication route group
│   │   ├── login/          # Login page
│   │   └── register/       # Register page
│   ├── candidate/          # Candidate routes
│   │   └── dashboard/      # Candidate dashboard
│   ├── interviewer/        # Interviewer routes
│   │   └── dashboard/      # Interviewer dashboard
│   └── api/                # API routes
├── components/             # Reusable React components
├── lib/                    # Utility functions and configurations
├── prisma/                 # Database schema and migrations
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS account (for S3 storage)
- SendGrid account (for emails)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd do-jo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Then edit `.env` with your actual credentials.

4. Set up the database:
```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:seed` - Seed the database

## Environment Variables

See `.env.example` for required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `AWS_*` - AWS S3 credentials
- `SENDGRID_*` - SendGrid API credentials

## Database Schema

The application uses Prisma ORM with PostgreSQL. Schema definitions are in `/prisma/schema.prisma`.

Run migrations to set up your database:
```bash
npm run prisma:migrate
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the application:
```bash
npm run build
```

Then start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@dojo-platform.com or open an issue on GitHub.
