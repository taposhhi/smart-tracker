# Smart Tracker

Smart Tracker is a full-stack task management web app. Users can create tasks, organize them on a drag-and-drop Kanban board, track the time spent on each task with a timer, and view a daily dashboard. Admins can see every user's tasks and dashboards and manage user accounts.

**Live demo:** https://smart-tracker-ntww.vercel.app

## Features

**User**
- Register and log in (email and password)
- Create, edit and delete tasks (title, description, priority)
- Kanban board with three columns: To Do, In Progress, Done
- Drag and drop tasks between columns
- Start and stop a timer on a task (saved as a time log)
- Daily dashboard with charts of time spent
- Light and dark theme toggle

**Admin**
- View all users' tasks
- View all users' dashboards
- Manage users (change role, delete)

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Authentication | Auth.js (next-auth v5), bcryptjs for password hashing |
| Database | PostgreSQL (hosted on Neon) |
| ORM | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Drag and drop | dnd-kit |
| Charts | Recharts |
| Validation | Zod |
| Hosting | Vercel |

## Dependencies

Runtime: `next`, `react`, `react-dom`, `next-auth`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `bcryptjs`, `zod`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dotenv`

Development: `prisma`, `typescript`, `tailwindcss`, `@tailwindcss/turbopack`, `eslint`, `eslint-config-next`, and the `@types/*` packages

All versions are listed in `package.json`.

**Requirements:** Node.js 20 or newer, npm, and a PostgreSQL database (a free Neon database works).

## Run it locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/taposhhi/smart-tracker.git
   cd smart-tracker
   ```

2. **Install dependencies** (this also runs `prisma generate`)
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root:
   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
   AUTH_SECRET=your-long-random-secret
   ```
   Generate a secret with `npx auth secret` or `openssl rand -base64 32`. Do not wrap values in quotes, and never commit this file.

4. **Create the database tables**
   ```bash
   npx prisma db push
   ```

5. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Environment variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret used by Auth.js to sign sessions |
| `AUTH_TRUST_HOST` | On Vercel | Set to `true` when deployed |

## Create an admin account

Registration always creates a normal user, so nobody can make themselves an admin.

1. Register a normal account on the `/register` page.
2. Run `npx prisma studio` and open the `User` table.
3. Change that user's `role` from `USER` to `ADMIN` and save.
4. Log in again. The admin panel is available at `/admin`.

## Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose Add New, then Project, and import the repository.
3. Add the environment variables `DATABASE_URL`, `AUTH_SECRET` and `AUTH_TRUST_HOST=true`.
4. Deploy. Vercel redeploys automatically on every push to `main`.

Changing an environment variable requires a redeploy to take effect.

## Project structure

```
prisma/schema.prisma        Database schema (User, Task, TimeLog)
prisma.config.ts            Prisma configuration
src/auth.ts                 Auth.js configuration
src/lib/prisma.ts           Prisma client
src/app/page.tsx            Landing page
src/app/login, register     Authentication pages
src/app/dashboard           Daily dashboard
src/app/board               Kanban board
src/app/admin               Admin panel
src/app/api/...             API routes (auth, register, tasks, timelogs, dashboard, admin)
src/components              DashboardView, KanbanBoard, ThemeToggle
```

## Data model

- **User**: id, name, email (unique), passwordHash, role (`USER` or `ADMIN`), createdAt
- **Task**: id, title, description, status (`TODO`, `IN_PROGRESS`, `DONE`), priority (`LOW`, `MEDIUM`, `HIGH`), position, userId, createdAt, updatedAt
- **TimeLog**: id, taskId, userId, startTime, endTime

A user has many tasks and many time logs. A task has many time logs. Deleting a user deletes their tasks and time logs.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |

## Test accounts

Test credentials are provided separately in `credentials.txt` with the project submission.
