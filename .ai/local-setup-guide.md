# Local Development Setup Guide

This guide walks through setting up the GSD application for local development with full frontend-backend integration.

## Prerequisites

- Node.js (version specified in `.nvmrc`)
- pnpm (package manager)
- Docker and Docker Compose (for PostgreSQL)

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

The backend `.env` file should already be configured for local development:

```bash
# Location: apps/backend/.env

DATABASE_URL="postgresql://gsd:gsd_dev_password@localhost:5432/gsd_dev?schema=public"
NODE_ENV=development
PORT=3000
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:4321
```

**Note**: Google OAuth credentials need to be obtained from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) for authentication to work.

### 3. Start PostgreSQL Database

```bash
cd tools/docker
docker-compose up -d postgres
```

Wait for PostgreSQL to be ready (about 5 seconds):

```bash
docker exec gsd-postgres pg_isready -U gsd
# Should output: /var/run/postgresql:5432 - accepting connections
```

### 4. Run Database Migrations

```bash
cd apps/backend
npx prisma migrate dev --name init
```

This creates the database schema with tables: `users`, `lists`, `tasks`

### 5. Start Backend Server

```bash
cd /path/to/gsd
pnpm --filter @gsd/backend dev
```

Backend runs on: http://localhost:3000

### 6. Start Frontend Server

In a separate terminal:

```bash
cd /path/to/gsd
pnpm --filter @gsd/frontend dev
```

Frontend runs on: http://localhost:4321

## Verification

### Check Backend Health

```bash
curl http://localhost:3000
# Should return: Hello World!
```

### Check Auth Integration

```bash
curl -I http://localhost:3000/auth/google
# Should return: 302 Found with redirect to Google OAuth
```

### Check Frontend

Open browser to http://localhost:4321

- Landing page should load
- "Sign in with Google" button should be visible
- Clicking button navigates to `/auth/google` (will show error without real OAuth credentials)

## Available API Endpoints

### Authentication

- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/signout` - Sign out

### Lists (v1 API)

- `GET /v1/lists` - Get all lists
- `POST /v1/lists` - Create list
- `DELETE /v1/lists/:id` - Delete list

### Tasks (v1 API)

- `GET /v1/tasks` - Get all tasks
- `POST /v1/tasks` - Create task
- `PATCH /v1/tasks/:id` - Update task
- `DELETE /v1/tasks/:id` - Delete task
- `POST /v1/tasks/:id/move` - Move task to different list
- `POST /v1/tasks/:id/complete` - Complete task
- `POST /v1/tasks/:id/reorder` - Reorder task

## Database Access

### Using Prisma Studio (GUI)

```bash
pnpm --filter @gsd/backend db:studio
```

Opens at: http://localhost:5555

### Using pgAdmin (Optional)

```bash
cd tools/docker
docker-compose --profile tools up -d pgadmin
```

Opens at: http://localhost:5050

- Email: dev@gsd.local
- Password: admin

## Quick Start Script

For convenience, you can start everything at once:

```bash
# Terminal 1: Start Docker
cd tools/docker && docker-compose up -d postgres

# Wait 5 seconds for Postgres...

# Terminal 2: Start Backend
cd /path/to/gsd && pnpm --filter @gsd/backend dev

# Terminal 3: Start Frontend
cd /path/to/gsd && pnpm --filter @gsd/frontend dev
```

## Stopping Services

### Stop Servers

Press `Ctrl+C` in each terminal running dev servers

### Stop Docker

```bash
cd tools/docker
docker-compose down
```

To also remove database volumes:

```bash
docker-compose down -v
```

## Troubleshooting

### Port Already in Use

- Backend (3000): Check with `lsof -ti:3000` and kill with `kill -9 <PID>`
- Frontend (4321): Check with `lsof -ti:4321` and kill with `kill -9 <PID>`
- PostgreSQL (5432): Check with `lsof -ti:5432` and kill container

### Database Connection Issues

- Verify Docker container is running: `docker ps | grep gsd-postgres`
- Check .env DATABASE_URL matches docker-compose.yml credentials
- Restart container: `docker-compose restart postgres`

### Migration Issues

- Reset database: `npx prisma migrate reset` (WARNING: destroys all data)
- Regenerate Prisma Client: `npx prisma generate`

## Next Steps

With local integration verified, you can now:

1. Implement Authentication Callback Page (`/auth/callback`)
2. Create App Shell for authenticated views
3. Build Plan Mode interface
4. Add Google OAuth credentials for full auth testing

## Current State

✅ PostgreSQL running in Docker
✅ Database schema migrated (users, lists, tasks tables)
✅ Backend running with all API endpoints
✅ Frontend running with landing page
✅ CORS configured for frontend-backend communication
⏳ Google OAuth credentials needed for authentication flow
