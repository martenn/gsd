# Local Development Setup Guide

**Last Updated:** 2025-12-31
**Target:** Development environment with Postgres in Docker

---

## Quick Start

```bash
# 1. Start Postgres
cd tools/docker
docker compose up -d

# 2. Set up backend environment
cd ../../apps/backend
cp .env.example .env
# Edit .env and add your Google OAuth credentials

# 3. Install dependencies (from root)
cd ../..
pnpm install

# 4. Run database migrations
cd apps/backend
pnpm db:migrate:dev

# 5. Start development servers (from root)
cd ../..
pnpm dev
```

Your app will be running at:
- **Frontend:** http://localhost:4321
- **Backend API:** http://localhost:3000
- **Postgres:** localhost:5432
- **pgAdmin (optional):** http://localhost:5050

---

## Detailed Setup

### Prerequisites

- **Node.js:** v20.19.6 (check `.nvmrc`)
- **pnpm:** v9.x
- **Docker:** 24.0+
- **Docker Compose:** v2.20+

**Install Node.js (using nvm):**
```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use the correct Node version
nvm install
nvm use
```

**Install pnpm:**
```bash
npm install -g pnpm@9
```

---

## Step 1: Start Postgres Database

### Using Docker Compose (Recommended)

```bash
# Navigate to tools/docker
cd tools/docker

# Start Postgres (daemon mode)
docker compose up -d

# Verify it's running
docker compose ps

# View logs
docker compose logs -f postgres
```

**What this does:**
- Starts PostgreSQL 16 on port 5432
- Database name: `gsd_dev`
- Username: `gsd`
- Password: `gsd_dev_password`
- Data persisted in Docker volume: `postgres_data`

### Optional: Start pgAdmin

```bash
# Start pgAdmin for database management UI
docker compose --profile tools up -d

# Access pgAdmin at: http://localhost:5050
# Email: dev@gsd.local
# Password: admin
```

**Connect to database in pgAdmin:**
- Host: `postgres` (or `host.docker.internal` if not working)
- Port: `5432`
- Database: `gsd_dev`
- Username: `gsd`
- Password: `gsd_dev_password`

---

## Step 2: Configure Backend Environment

### Create .env file

```bash
cd apps/backend

# Copy example environment
cp .env.example .env

# Edit with your favorite editor
nano .env
# or
code .env
```

### Required Configuration

**1. Database (already configured for local Postgres):**
```bash
DATABASE_URL="postgresql://gsd:gsd_dev_password@localhost:5432/gsd_dev?schema=public"
```

**2. Google OAuth Credentials (REQUIRED):**

Go to: https://console.cloud.google.com/apis/credentials

1. Create a new OAuth 2.0 Client ID (if you don't have one)
2. Application type: **Web application**
3. Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
4. Copy the Client ID and Client Secret

```bash
# In .env file
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**3. JWT Secret (generate a secure random string):**

```bash
# Generate a random secret
openssl rand -base64 32

# Copy the output to .env
JWT_SECRET=generated-secret-from-above-command
```

**4. Other settings (defaults are fine):**
```bash
NODE_ENV=development
PORT=3000
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:4321
```

### Complete .env Example

```bash
# Database
DATABASE_URL="postgresql://gsd:gsd_dev_password@localhost:5432/gsd_dev?schema=public"

# Application
NODE_ENV=development
PORT=3000

# Google OAuth (CHANGE THESE)
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT (CHANGE THIS)
JWT_SECRET=your-generated-secret-32-chars-minimum
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:4321
```

---

## Step 3: Install Dependencies

```bash
# From project root
cd /home/pmartenka/dev/repos/10xdevs/gsd

# Install all dependencies (backend, frontend, packages)
pnpm install
```

This installs dependencies for:
- Backend (NestJS)
- Frontend (Astro + React)
- Shared packages (types, validation)

---

## Step 4: Run Database Migrations

```bash
# From backend directory
cd apps/backend

# Generate Prisma Client
pnpm db:generate

# Run migrations (creates tables)
pnpm db:migrate:dev

# Verify tables were created
pnpm db:studio
# This opens Prisma Studio at http://localhost:5555
```

**What this does:**
- Applies all migrations in `prisma/migrations/`
- Creates database schema (users, lists, tasks, etc.)
- Generates Prisma Client for type-safe queries

---

## Step 5: Start Development Servers

### Option 1: Start Everything Together (Recommended)

```bash
# From project root
pnpm dev
```

This starts:
- **Backend:** http://localhost:3000 (NestJS with hot reload)
- **Frontend:** http://localhost:4321 (Astro with hot reload)

### Option 2: Start Individually

```bash
# Terminal 1: Backend
cd apps/backend
pnpm dev

# Terminal 2: Frontend
cd apps/frontend
pnpm dev
```

---

## Verify Setup

### 1. Check Backend Health

```bash
# Backend health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","info":{"database":{"status":"up"}}}
```

### 2. Check Frontend

Open browser: http://localhost:4321

Should see the GSD app landing page.

### 3. Test Google OAuth Login

1. Go to http://localhost:4321
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, redirects back to app
5. User should be created in database

### 4. Check Database

```bash
# Using Prisma Studio
cd apps/backend
pnpm db:studio

# Or using psql
docker compose -f tools/docker/docker-compose.yml exec postgres psql -U gsd -d gsd_dev

# List tables
\dt

# View users
SELECT * FROM "User";

# Exit
\q
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start Postgres (if not running)
cd tools/docker
docker compose up -d

# 2. Start dev servers
cd ../..
pnpm dev

# 3. Make changes to code
# - Backend: apps/backend/src/**
# - Frontend: apps/frontend/src/**
# - Both have hot reload

# 4. View changes in browser
# - Frontend: http://localhost:4321
# - API docs: http://localhost:3000/api

# 5. Stop servers when done
# Ctrl+C to stop dev servers

# 6. Stop Postgres (optional)
cd tools/docker
docker compose down
```

### Running Tests

```bash
# Backend unit tests
cd apps/backend
pnpm test

# Backend e2e tests
pnpm test:e2e

# Backend test coverage
pnpm test:cov

# Watch mode (reruns on file change)
pnpm test:watch
```

### Running Linting

```bash
# Lint backend
cd apps/backend
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm typecheck
```

### Database Management

```bash
# Create a new migration
cd apps/backend
pnpm db:migrate:dev --name add_new_feature

# Reset database (WARNING: deletes all data)
pnpm db:migrate:reset

# Open Prisma Studio
pnpm db:studio

# View database in psql
docker compose -f ../../tools/docker/docker-compose.yml exec postgres psql -U gsd -d gsd_dev
```

### Viewing Logs

```bash
# Postgres logs
cd tools/docker
docker compose logs -f postgres

# Backend logs (in terminal where pnpm dev is running)
# Frontend logs (in terminal where pnpm dev is running)
```

---

## Troubleshooting

### Backend Won't Start

**Error: "JWT_SECRET environment variable is required"**

```bash
# Check .env file exists
cd apps/backend
ls -la .env

# If missing, create it
cp .env.example .env

# Generate JWT secret
openssl rand -base64 32

# Add to .env file
nano .env
```

**Error: "Can't reach database server"**

```bash
# Check if Postgres is running
cd tools/docker
docker compose ps

# If not running, start it
docker compose up -d

# Check logs
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U gsd -d gsd_dev
```

### Frontend Won't Start

**Error: "Failed to fetch from API"**

```bash
# Ensure backend is running
curl http://localhost:3000/health

# Check FRONTEND_URL in backend .env
cd apps/backend
grep FRONTEND_URL .env
# Should be: FRONTEND_URL=http://localhost:4321
```

### Google OAuth Not Working

**Error: "redirect_uri_mismatch"**

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Add **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`
4. Save and try again (may take a few minutes to propagate)

**Error: "invalid_client"**

```bash
# Check your .env credentials
cd apps/backend
grep GOOGLE .env

# Verify they match Google Cloud Console
```

### Database Migrations Fail

**Error: "Migration failed"**

```bash
# Reset database and rerun migrations
cd apps/backend
pnpm db:migrate:reset

# This will:
# 1. Drop all tables
# 2. Rerun all migrations
# 3. Regenerate Prisma Client
```

### Port Already in Use

**Error: "Port 3000 is already in use"**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change backend port in .env
PORT=3001
```

**Error: "Port 5432 is already in use"**

```bash
# Check if another Postgres is running
ps aux | grep postgres

# Stop local Postgres (if installed)
sudo systemctl stop postgresql

# Or change Docker port
# Edit tools/docker/docker-compose.yml:
# ports:
#   - '5433:5432'  # Use 5433 on host
#
# Then update DATABASE_URL in apps/backend/.env:
# DATABASE_URL="postgresql://gsd:gsd_dev_password@localhost:5433/gsd_dev?schema=public"
```

### Clean Slate (Nuclear Option)

```bash
# Stop everything
cd tools/docker
docker compose down -v  # -v removes volumes (deletes data!)

# Remove node_modules
cd ../..
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install

# Start fresh
cd tools/docker
docker compose up -d
cd ../../apps/backend
pnpm db:migrate:dev
cd ../..
pnpm dev
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://gsd:gsd_dev_password@localhost:5432/gsd_dev?schema=public` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Backend port | `3000` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-...` |
| `GOOGLE_CALLBACK_URL` | OAuth callback | `http://localhost:3000/auth/google/callback` |
| `JWT_SECRET` | JWT signing secret | (32+ char random string) |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `FRONTEND_URL` | Frontend origin | `http://localhost:4321` |

### Frontend (.env - if needed)

Frontend gets environment variables from `astro.config.mjs` and uses the backend URL configured there.

---

## Useful Commands

### Development

```bash
pnpm dev                    # Start all dev servers
pnpm build                  # Build all packages
pnpm test                   # Run all tests
pnpm lint                   # Lint all code
pnpm typecheck              # Type check all code
```

### Backend-Specific

```bash
cd apps/backend
pnpm dev                    # Start backend dev server
pnpm build                  # Build backend
pnpm test                   # Run backend tests
pnpm test:e2e               # Run e2e tests
pnpm lint                   # Lint backend
pnpm db:studio              # Open Prisma Studio
pnpm db:migrate:dev         # Run migrations
pnpm db:generate            # Generate Prisma Client
```

### Frontend-Specific

```bash
cd apps/frontend
pnpm dev                    # Start frontend dev server
pnpm build                  # Build frontend
pnpm preview                # Preview production build
pnpm lint                   # Lint frontend
```

### Database

```bash
cd tools/docker
docker compose up -d                                    # Start Postgres
docker compose down                                     # Stop Postgres
docker compose down -v                                  # Stop and remove data
docker compose logs -f postgres                         # View logs
docker compose exec postgres psql -U gsd -d gsd_dev    # Access psql
```

---

## Tips for Productive Development

### 1. Use Prisma Studio

```bash
cd apps/backend
pnpm db:studio
```

- Visual database browser
- Edit records directly
- See relationships
- No SQL needed

### 2. API Documentation (Swagger)

Visit: http://localhost:3000/api

- Interactive API docs
- Test endpoints directly
- See request/response schemas

### 3. Hot Reload

Both backend and frontend have hot reload:
- Save file → Browser/server auto-updates
- No manual restarts needed

### 4. Database Seeding (Future)

Create seed data for development:

```bash
cd apps/backend

# Create seed script
nano prisma/seed.ts

# Run seed
pnpm db:seed
```

### 5. Multiple Google OAuth Clients

For different environments, create separate OAuth clients:
- Development: `http://localhost:3000/auth/google/callback`
- Production: `https://getsd.bieda.it/api/auth/google/callback`

This way you can test without affecting production.

---

## Production vs Development Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| **Database** | Docker Postgres on localhost | Docker Postgres on server |
| **Backend** | Nest dev server (hot reload) | Docker container (compiled) |
| **Frontend** | Astro dev server (hot reload) | Docker container (static build) |
| **Nginx** | Not used | Reverse proxy on port 8080 |
| **OAuth Callback** | http://localhost:3000/... | https://getsd.bieda.it/api/... |
| **HTTPS** | Not needed (HTTP) | Required (external proxy) |
| **Environment** | `.env` files | Docker environment variables |

---

## Next Steps

After setup is complete:

1. **Explore the codebase:**
   - Backend: `apps/backend/src/`
   - Frontend: `apps/frontend/src/`
   - Shared types: `packages/types/`

2. **Review project tracker:**
   - See: `.ai/project-tracker.md`
   - Check what's implemented
   - See what's remaining

3. **Start developing:**
   - Pick a feature from tracker
   - Create a feature branch
   - Implement and test
   - Submit PR

4. **Read architecture docs:**
   - `CLAUDE.md` - Project guidelines
   - `.ai/plans/` - Implementation plans
   - `DEPLOYMENT.md` - Production deployment

---

**Happy coding! 🚀**
