## GSD (Getting Shit Done)

[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/workspaces)
![Monorepo](https://img.shields.io/badge/monorepo-pnpm-blue)
![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)

### Project description

GSD is a focused, single-user productivity app inspired by GTD. It helps you plan and execute work using multiple user-managed backlogs, user‑named intermediate lists (e.g., Week, Today), and a distraction‑free work mode. Plan in plan mode (manage lists and tasks) and execute in work mode (single‑task focus with a short forecast). Completing tasks moves them to a separate Done archive and powers simple daily/weekly metrics.

Target platform: responsive web (desktop and mobile web). Online‑only for MVP.

### Table of contents

- [Tech stack](#tech-stack)
- [Getting started locally](#getting-started-locally)
- [Available scripts](#available-scripts)
- [Project scope](#project-scope)
- [Project status](#project-status)
- [License](#license)

## Tech stack

- **Monorepo**: pnpm workspaces (`apps/`, `packages/`, `tools/`)
- **Frontend**: Astro (islands) + React 19, Tailwind CSS, shadcn/ui, lucide-react, TanStack Query, react-hook-form + zod
- **Backend**: NestJS 11 (REST), Prisma (PostgreSQL), class-validator/transformer, Swagger, scheduling, CORS/helmet/rate limiting, JWT via HttpOnly cookie, Google OAuth (planned)
- **Database**: PostgreSQL 16; Prisma migrate; indexes on `user_id`, `list_id`, `completed_at`, `order_index`; transactions via `$transaction`
- **Packages**: `@gsd/types` (shared TS types), `@gsd/validation` (Zod schemas)
- **Tooling**: TypeScript strict, ESLint, Prettier, Jest, supertest
- **Dev infra**: Docker Compose (Postgres + optional pgAdmin)

Refer to the detailed docs: [Product Requirements](./.ai/prd.md) and [Tech Stack Summary](./.ai/tech-stack.md). Additional notes in `additional-docs/`.

## Getting started locally

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Docker + Docker Compose

### 1) Install dependencies

```bash
pnpm install
```

### 2) Start PostgreSQL (Docker)

```bash
docker compose -f tools/docker/docker-compose.yml up -d
```

Services:
- Postgres on `localhost:5432` (user `gsd`, password `gsd_dev_password`, db `gsd_dev`)
- Optional pgAdmin on `localhost:5050` (email `dev@gsd.local`, password `admin`)

### 3) Configure backend environment

Create `apps/backend/.env`:

```env
DATABASE_URL=postgresql://gsd:gsd_dev_password@localhost:5432/gsd_dev
# Optional:
# PORT=3000
```

### 4) Generate Prisma client and run migrations

```bash
pnpm db:generate
pnpm db:migrate
# Optional seed (if implemented)
pnpm db:seed
```

### 5) Run the app in development

```bash
pnpm dev
```

Default URLs:
- Frontend (Astro): `http://localhost:4321`
- Backend (NestJS): `http://localhost:3000`

Optional tools:
- Prisma Studio: `pnpm db:studio`
- pgAdmin: open `http://localhost:5050`

## Available scripts

### Root

- `pnpm dev`: run all apps in parallel (backend + frontend)
- `pnpm dev:backend` / `pnpm dev:frontend`: run a single app
- `pnpm build`: build packages then apps
- `pnpm build:packages` / `pnpm build:apps`
- `pnpm test`: run tests in apps
- `pnpm lint` / `pnpm typecheck`
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:studio`: proxy to backend Prisma scripts
- `pnpm clean`: remove `dist` and `node_modules` across workspace

### Backend (`apps/backend`)

- `pnpm dev`: Nest dev server with watch
- `pnpm build` / `pnpm start`
- `pnpm lint` / `pnpm typecheck`
- `pnpm test` / `pnpm test:e2e` / `pnpm test:cov`
- Prisma: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:migrate:deploy`, `pnpm db:seed`, `pnpm db:studio`

### Frontend (`apps/frontend`)

- `pnpm dev`: Astro dev server
- `pnpm build` / `pnpm preview`
- `pnpm typecheck`

### Packages

- `packages/types`: `pnpm build`, `pnpm typecheck`
- `packages/validation`: `pnpm build`, `pnpm typecheck`

## Project scope

### In scope (MVP)

- Multiple user-managed lists with CRUD and manual reordering; mark/unmark lists as backlogs
- Today list created by default (renamable/deletable); Done list is special and hidden
- Plan mode (full control) and Work mode (focused complete-only action with forecast)
- Keyboard-first interaction (arrows; h/j/k/l); “?” help overlay
- Dump mode for quick multi-line add (up to 10 lines) into default backlog
- Google OAuth sign-in/out and single-user data isolation (planned)
- Done view with pagination; retention keeps last 500 completed tasks
- Metrics based on `completed_at`; week starts Monday; local timezone presentation

### Out of scope (MVP)

- Collaboration/shared boards, drag-and-drop, offline/PWA, rich reminders/due dates/calendar sync
- Complex error handling, advanced onboarding/coaching UX

Constraints and limits:
- Up to 10 non-Done lists, up to 100 tasks per list

See the full [PRD](./.ai/prd.md) for user stories and acceptance criteria.

## Project status

- Status: MVP scaffolding in progress
- Present: Monorepo structure, Astro + React starter, NestJS app shell, Prisma schema and DB docker setup, shared packages skeleton
- Planned next: Implement auth (Google + JWT), lists/tasks modules and endpoints, UI for plan/work/done modes, metrics, retention jobs, keyboard help overlay, Swagger docs, CI

Known gaps for local dev:
- No `.env.example` yet; set `DATABASE_URL` as documented above
- OAuth credentials, JWT secret, and security middleware configuration pending

## License

UNLICENSED (private). Licensing to be determined.
