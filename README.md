# EthioStudentHub — MVP

A student resource platform for Ethiopian universities: browse and upload previous exams,
lecture notes, and course materials, organized by university → department → course.

This is a **working foundation**, not the entire feature list from the original brief.
It's built so you can run it locally today and grow it feature by feature. See
"What's implemented" and "Roadmap" below for exactly what's real vs. planned.

## Stack

- **Backend:** Node.js, Express, PostgreSQL, Prisma, JWT auth, Cloudinary file storage, Socket.io
- **Frontend:** React, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env      # fill in JWT secrets + Cloudinary keys
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

Then run migrations and seed data once the containers are up:

```bash
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run seed
```

Sample login after seeding: `admin@ethiostudenthub.com` / `Password123!`
(role: ADMIN — seeded accounts are auto-verified, so verification is only
required for new sign-ups)

## Quick start (without Docker)

Requires Node 20+ and a local/hosted PostgreSQL instance (e.g. Neon or Supabase).

```bash
# Backend
cd backend
cp .env.example .env   # set DATABASE_URL, JWT secrets, Cloudinary keys
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev

# Frontend (in a new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## What's implemented in this MVP

- PostgreSQL schema (Prisma) for users/roles, universities, departments, courses,
  resources, comments, likes, bookmarks, reports, notifications, Q&A
- JWT auth: register, login, refresh token, role-based access control
  (Guest / Student / University Rep / Moderator / Admin)
- **Email verification** (24h token, resend endpoint) and **forgot/reset password**
  (1h token) — uses Nodemailer; without SMTP env vars set, emails are logged to
  the backend console instead of sent, so the flow is testable without a mail provider
- Resource upload (Cloudinary), browse, search & filter, download tracking,
  like/bookmark toggle, comments, moderation approve/reject
- University & department directory API, seeded with 11 Ethiopian universities
- **Student dashboard**: profile, my uploads, bookmarks, notifications (tabs, live data)
- **Admin/moderation panel**: approve/reject pending resources, list + ban/unban users
- Frontend: homepage, search/browse, resource detail, login/register, verify-email,
  forgot/reset password, dashboard, admin panel — all connected to the real API,
  with an auth context that gates protected routes by role

## Roadmap (not yet built — the rest of the original brief)

These are sketched in the schema comments or left out entirely, and are good targets
for focused follow-up sessions:

- Google/GitHub OAuth, 2FA
- University rep dashboard (separate from admin/moderator)
- Achievements/badges UI, dark mode
- Gamification: leaderboard, contributor points display
- Student marketplace (buy/sell/exchange books, find roommates)
- Scholarships, internships, career center (resume builder, CV templates)
- AI features: study assistant, PDF summary, flashcards, quiz/exam generator,
  study planner, career advisor
- Real-time chat (Socket.io server is wired up; no chat UI yet)
- PDF/PPT in-browser preview, OCR, plagiarism/duplicate detection
- PWA support, offline reading, multi-language (English/Amharic)
- Full admin analytics dashboards, audit logs
- Automated tests (unit/integration/e2e), CI/CD, Swagger API docs

## Project structure

```
ethiostudenthub/
├── backend/
│   ├── prisma/schema.prisma   # DB schema
│   ├── prisma/seed.js         # sample data
│   └── src/
│       ├── routes/            # auth, universities, resources
│       ├── middleware/        # JWT auth, RBAC
│       ├── config/            # prisma client, cloudinary/multer
│       └── index.js           # app entry
├── frontend/
│   └── src/
│       ├── pages/             # Home, Browse, ResourceDetail, Login, Register
│       ├── components/        # Navbar, Footer
│       └── api/client.js      # axios instance
└── docker-compose.yml
```
