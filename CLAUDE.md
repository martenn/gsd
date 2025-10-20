# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GSD (Getting Shit Done)** is a focused personal productivity app inspired by GTD. It helps solo users plan and execute work using multiple user-managed backlogs, intermediate lists, and a focused work mode. The MVP targets responsive web (desktop and mobile), single-user accounts, with Google OAuth authentication.

**Current Status**: Pre-implementation phase with comprehensive PRD and tech stack defined.

## Tech Stack

### Frontend
- **Framework**: Astro (islands architecture) + React 19
- **Styling/UI**: Tailwind CSS + shadcn/ui + lucide-react
- **State Management**: TanStack Query (server state), local UI state in React
- **Forms/Validation**: react-hook-form + zod
- **Routing**: Astro pages with React app mounted for authenticated app shell
- **API Client**: fetch wrapper with typed DTOs; optional OpenAPI client generation from backend swagger

### Backend
- **Runtime/Framework**: NestJS (REST, modular architecture)
- **ORM**: Prisma (PostgreSQL)
- **Authentication**: Google OAuth 2.0 (@nestjs/passport + passport-google-oauth20)
- **Session**: Backend-issued JWT in HttpOnly cookie
- **Validation**: class-validator + class-transformer (DTOs)
- **Scheduling**: @nestjs/schedule (retention/reindex jobs)
- **Security**: CORS, helmet, rate limiting (@nestjs/throttler)

### Database
- **Engine**: PostgreSQL 16
- **Migrations**: `prisma migrate`
- **Indexes**: On user_id, list_id, completed_at, order_index
- **Transactions**: Handled in Nest services via Prisma $transaction
- **Local Dev**: docker-compose (Postgres + optional pgAdmin)

### Build & Quality
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest + @nestjs/testing (unit), supertest (e2e)
- **API Docs**: Swagger via @nestjs/swagger

## Architecture & Key Concepts

### Core Domain Model

**Lists**:
- Users can create, rename, delete, and reorder lists
- Three types: backlog, intermediate, and done
- Backlogs are always leftmost; users may have multiple backlogs (marked/unmarked by user)
- At least one backlog must always exist
- Done is special and hidden from the main board
- Flow: backlogs → intermediate lists (e.g., Week, Today) → Done
- Active work list is the rightmost non-Done list
- Limit: 10 non-Done lists per user

**Tasks**:
- A task belongs to exactly one list at a time
- Fields: title (required), description (optional), list_id, created_at, completed_at (nullable), order_index
- New/moved tasks are inserted at the top of the target list
- Completing a task moves it to Done and sets completed_at
- Limit: 100 tasks per list
- Visual origin: tasks inherit color from their origin backlog (system-assigned)

**Done Archive**:
- Separate read-only view with pagination (50 items per page)
- Retention: keep last N=500 completed tasks per user, delete oldest first
- Timestamps stored in UTC, rendered in user's local timezone

### User Modes

**Plan Mode**:
- Full task and list management interface
- Keyboard-first navigation (arrow keys primary; vim-style h/j/k/l alternates)
- Spreadsheet-like cell selection behavior
- "?" shortcut opens keyboard help overlay
- Controls disabled when limits are reached

**Work Mode**:
- Focused execution view showing top task of active work list (rightmost non-Done)
- Displays short forecast of next 2-3 tasks
- Single action: mark current task complete (moves to Done, advances to next)

**Dump Mode**:
- Quick multi-line task creation into default backlog
- Max 10 lines per submission
- Blank lines removed, duplicates allowed

### Backend Modules

Aligned to PRD requirements:

- **AuthModule**: Google OAuth login/callback, JWT issuance
- **ListsModule**: CRUD, reorder, toggle backlog status, delete-with-move
- **TasksModule**: CRUD, move (insert at top), reorder, complete (set completed_at)
- **MetricsModule**: Daily/weekly aggregates (UTC storage, timezone applied in API)
- **DoneModule**: Paginated read; retention job (keep N=500/user)
- **MaintenanceModule**: Cron for retention and optional reindex
- **HealthModule**: Liveness/readiness endpoints

### API Surface (v1)

Authentication:
- `POST /auth/google` (init OAuth flow)
- `GET /auth/google/callback` (OAuth callback)

Lists:
- `GET/POST/PATCH/DELETE /v1/lists`
- `POST /v1/lists/:id/toggle-backlog`
- `DELETE /v1/lists/:id?dest=:destId` (delete with destination for tasks)

Tasks:
- `GET/POST/PATCH/DELETE /v1/tasks`
- `POST /v1/tasks/:id/move` (move to different list)
- `POST /v1/tasks/:id/complete` (move to Done)
- `POST /v1/tasks/bulk-add` (dump mode)

Done & Metrics:
- `GET /v1/done?page=n` (paginated completed tasks)
- `GET /v1/metrics/daily` (daily completion counts)
- `GET /v1/metrics/weekly` (weekly completion counts, week starts Monday)

## Key Constraints & Requirements

### Business Rules
- At least one backlog must always exist; if deleting last backlog, promote leftmost intermediate list or block deletion
- Tasks move to Done when completed (from any list), setting completed_at
- Deleting a list requires choosing a destination list for its tasks (defaults to default backlog)
- Single-user accounts only; data isolation enforced at API level

### Limits & Performance
- Maximum 10 non-Done lists per user
- Maximum 100 tasks per list
- Design for performance at these limits; consider virtualization if needed
- Target: 95th percentile list interactions <100 ms

### Keyboard Navigation
- Arrow keys as primary navigation
- Vim-style h/j/k/l as alternates
- "?" opens keyboard shortcuts overlay
- Controls disabled (not hidden) when limits reached

### Mobile Considerations
- Show one list at a time with horizontal navigation (swipe left/right)
- Backlog selection via searchable dropdown
- Work mode is full-screen with only Complete action

### Success Metrics
- **Primary KPI**: Tasks completed per user per week (target: 10+ at MVP)
- Store timestamps in UTC, render in user's local timezone
- Week starts Monday
- Track daily/weekly aggregates

## Development Workflow

### Local Development Setup
1. Start Postgres via docker-compose
2. Run Prisma migrations: `prisma migrate dev`
3. Start Nest dev server (backend)
4. Start Astro dev server (frontend)

### Database Migrations
- Use Prisma: `prisma migrate dev` (development) or `prisma migrate deploy` (production)
- Always include indexes on: user_id, list_id, completed_at, order_index

### Testing
- **Unit tests**: Jest + @nestjs/testing for backend services
- **E2E tests**: supertest for API endpoints
- Focus on business logic: list/task CRUD, limits enforcement, backlog constraints

### CI/CD
- GitHub Actions workflow: lint, typecheck, test, build
- Deploy: Containerized (Docker) for both frontend and backend services
- Postgres: managed service or self-hosted

## Open Implementation Questions

These need to be resolved during implementation:

1. **Order indexing strategy**: Fractional vs stepped integers; reindexing approach
2. **Keyboard map completeness**: Full list of shortcuts for help overlay
3. **Backlog color palette**: System-assigned color scheme and persistence
4. **Error handling**: Strategy beyond disabled controls (server failures, optimistic updates, retries)
5. **Mobile gestures**: Long-press behaviors, action toolbar design

## Important Notes

- **Keyboard-first**: No drag-and-drop in MVP; all interactions via keyboard
- **No undo**: Tasks can be recreated if needed; keep operations simple
- **Hard delete**: No soft deletes for MVP (lists/tasks are permanently removed)
- **Error UX**: Disable controls at limits; show inline errors on failures; no toasts or complex flows
- **Auth**: Google OAuth only; no other providers in MVP
- **Collaboration**: Out of scope; single-user only
- **Offline**: Not supported in MVP; online-only web app
