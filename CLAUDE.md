# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Meta-Rules for Claude Code

**IMPORTANT:** When architectural patterns, coding standards, or rules are established or changed during a conversation:

1. Always update CLAUDE.md with the new rule/pattern (this file)
2. Always update the corresponding `.cursor/rules/*.mdc` file(s)
3. Both files must stay in sync
4. Changes should be made in the same response/action

**Custom Commands Sync:**

- `.claude/commands/` - Used by Claude Code (this IDE)
- `.cursor/commands/` - Used by Cursor IDE
- Both directories must stay in sync
- Run `./.maintain-command-sync.sh` to sync both directories
- Update both locations when adding/modifying commands

This ensures consistency across all development tools and documentation.

## Project Overview

**GSD (Getting Shit Done)** is a focused personal productivity app inspired by GTD. It helps solo users plan and execute work using multiple user-managed backlogs, intermediate lists, and a focused work mode. Single-user accounts, Google OAuth, responsive web (desktop primary; mobile in progress).

**Current Status**: MVP shipped — backend feature-complete, Plan/Work/Done/Dump modes live, deployed on mikrus at `getsd.bieda.it`. Open improvements are tracked as a flat priority list in [.ai/post-mvp-plan.md](./.ai/post-mvp-plan.md); top of that list is the next pick.

## Tech Stack

### Frontend
- **Framework**: Astro (islands architecture) + React 19
- **Styling/UI**: Tailwind CSS + shadcn/ui + lucide-react
- **State Management**: TanStack Query (server state), local UI state in React
- **Forms/Validation**: react-hook-form + zod
- **API Client**: fetch wrapper with typed DTOs

### Backend
- **Framework**: NestJS (REST, modular architecture)
- **ORM**: Prisma (PostgreSQL)
- **Authentication**: Google OAuth 2.0 + JWT in HttpOnly cookie
- **Validation**: class-validator + class-transformer
- **Scheduling**: @nestjs/schedule (retention/reindex jobs)
- **Security**: CORS, helmet, rate limiting (@nestjs/throttler)

### Database
- **Engine**: PostgreSQL 16
- **Migrations**: `prisma migrate`
- **Indexes**: On user_id, list_id, completed_at, order_index

### Build & Quality
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest + @nestjs/testing (unit), supertest (e2e)
- **API Docs**: Swagger via @nestjs/swagger
- **Monorepo**: pnpm workspaces

## Monorepo Structure

```
gsd/
├── apps/
│   ├── backend/          # NestJS API (@gsd/backend)
│   │   ├── src/          # Source code
│   │   ├── test/         # Tests (unit + e2e)
│   │   └── prisma/       # Database schema and migrations
│   └── frontend/         # Astro + React (@gsd/frontend)
│       ├── src/
│       │   ├── components/  # React components
│       │   └── pages/       # Astro pages
│       └── public/
├── packages/
│   ├── types/            # Shared TypeScript types (@gsd/types)
│   └── validation/       # Shared Zod schemas (@gsd/validation)
├── tools/
│   └── docker/           # docker-compose.yml for local Postgres
├── package.json          # Root workspace config
├── pnpm-workspace.yaml   # Workspace definition
└── tsconfig.base.json    # Shared TypeScript config
```

**Key Commands:**

- `pnpm dev` - Start both apps in dev mode
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run all tests
- `pnpm db:migrate` - Run Prisma migrations
- `pnpm db:studio` - Open Prisma Studio

## Core Domain Model

### Lists

- Users can create, rename, delete, and reorder lists
- Three types: backlog, intermediate, and done
- Backlogs are always leftmost; users may have multiple backlogs (marked/unmarked by user)
- At least one backlog must always exist
- Done is special and hidden from the main board
- Flow: backlogs → intermediate lists (e.g., Week, Today) → Done
- Active work list selection (consumed by Work Mode):
  - If at least one intermediate list (non-backlog, non-done) exists → rightmost intermediate (highest `orderIndex` among intermediate lists)
  - Otherwise (backlog-only setup) → leftmost backlog (lowest `orderIndex` among backlogs)
- Limit: 10 non-Done lists per user

### Tasks

- A task belongs to exactly one list at a time
- Fields: title (required), description (optional), list_id, created_at, completed_at (nullable), order_index
- New/moved tasks are inserted at the top of the target list
- Completing a task moves it to Done and sets completed_at
- Limit: 100 tasks per list
- Visual origin: tasks inherit color from their origin backlog (system-assigned)

### Done Archive

- Separate read-only view with pagination (50 items per page)
- Retention: keep last N=500 completed tasks per user, delete oldest first
- Timestamps stored in UTC, rendered in user's local timezone

### User Modes

**Plan Mode:**
- Full task and list management interface
- Keyboard-first navigation (arrow keys primary; vim-style h/j/k/l alternates)
- Spreadsheet-like cell selection behavior
- "?" shortcut opens keyboard help overlay
- Controls disabled when limits are reached

**Work Mode:**
- Focused execution view showing top task of the active work list (selection rule defined under "Lists" above)
- Displays short forecast of next 2-3 tasks
- Single action: mark current task complete (moves to Done, advances to next)

**Dump Mode:**
- Quick multi-line task creation into default backlog
- Max 10 lines per submission
- Blank lines removed, duplicates allowed

## API Documentation

**Complete API specification**: See `apps/backend/openapi.yaml` for detailed endpoint documentation, request/response schemas, and validation rules.

**API Overview:**
- **Authentication**: Google OAuth 2.0 flow with JWT in HttpOnly cookie
- **Lists**: CRUD operations, reorder, toggle backlog status, delete with destination
- **Tasks**: CRUD operations, move between lists, complete, reorder, bulk add (dump mode)
- **Done**: Paginated read-only archive of completed tasks
- **Metrics**: Daily/weekly completion aggregates with timezone support
- **Health**: Liveness and readiness endpoints

**Base Endpoints:**
- `/v1/lists` - List management
- `/v1/tasks` - Task management
- `/v1/done` - Completed tasks archive
- `/v1/metrics/daily` - Daily completion metrics
- `/v1/metrics/weekly` - Weekly completion metrics
- `/health` - Health checks

## Architecture Patterns

### Backend Module Structure (Clean Architecture)

```
apps/backend/src/{domain}/
├── adapters/              # HTTP layer (controllers)
│   └── {domain}.controller.ts
├── use-cases/             # Business logic layer
│   ├── {operation}.ts
│   └── {operation}.spec.ts
├── infra/                 # Infrastructure layer (database)
│   └── {domain}.repository.ts
├── dto/                   # Request DTOs with validation
│   └── {request}.dto.ts
└── {domain}.module.ts     # NestJS module configuration
```

**Layer Responsibilities:**

1. **Adapters** (HTTP layer): Controllers only; delegate to use cases. No business logic.
2. **Use Cases** (Business logic): One class per operation with single `execute()` method. Prefer depending on other use cases over repositories for cross-domain operations.
3. **Infrastructure** (Database layer): Repositories encapsulate all Prisma operations. Return Prisma entities. No business logic.
4. **Module Rules**: No `index.ts` file. Export only the module. Cross-domain dependencies via module imports.

### DTO Architecture Pattern

**Type Sharing Strategy:**

- `@gsd/types/api/*.ts` → Shared interfaces (frontend + backend)
- `apps/backend/src/*/dto/*.ts` → Backend-only classes with class-validator decorators

**Example:**
```typescript
// @gsd/types/api/lists.ts (shared)
export interface CreateListRequest {
  name: string;
  isBacklog?: boolean;
}

// apps/backend/src/lists/dto/create-list.dto.ts (backend only)
export class CreateListDto implements CreateListRequest {
  @IsString() @MinLength(1) @MaxLength(100)
  name: string;

  @IsBoolean() @IsOptional()
  isBacklog?: boolean;
}
```

**Rationale:** Frontend gets pure TypeScript interfaces (no class-validator dependency). Backend maintains full runtime validation. Single source of truth for API contracts.

### Feature Separation

- Each feature has its own folder: `/src/{feature}/`
- Features should not mix concerns - keep color management separate from list management
- Cross-feature dependencies via module imports
- Export only what other features need
- Use dependency injection for cross-feature services
- Avoid circular dependencies

## Key Business Rules & Constraints

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

### Project Tracking

- **IMPORTANT**: After completing any feature, module, or significant implementation, update `.ai/project-tracker.md`
- Mark completed features with ✅ status
- Update progress percentages for the relevant phase
- Update the "Last Updated" timestamp
- Open improvements live as a flat priority list in [.ai/post-mvp-plan.md](./.ai/post-mvp-plan.md); tracker remains the line-item source of truth

### Documentation Organization

- **View Implementation Plans**: Store in `.ai/plans/` directory
  - File naming: `{view-name}-view-implementation-plan.md`
  - Example: `.ai/plans/app-shell-view-implementation-plan.md`
- **Project Documentation**: Store in `.ai/` root for project-wide docs
- **Coding Standards**: Store in `.ai/standards/` directory (see Coding Standards section below)

## Open Implementation Questions

Resolved during MVP build; remaining items live in the improvements list at [.ai/post-mvp-plan.md](./.ai/post-mvp-plan.md):

- **Keyboard map completeness** — full shortcut list for the help overlay.
- **Mobile gestures** — long-press behaviors, swipe ownership vs. DnD.
- **Drag & drop** — shipped for desktop (`lg+`) within and across lists; mobile DnD still deferred.

Already resolved:

- Order indexing: 1000-step increments with midpoint splits on reorder (`apps/backend/src/tasks/infra/order-index.helper.ts`).
- Backlog color palette: `ColorPool` assigns from a fixed palette; tasks inherit from `originBacklogId`.
- Error UX baseline: disabled controls at limits, inline errors on failures.

## Important Notes

Project stance (still in force post-MVP unless explicitly revisited):

- **Keyboard-first**: arrow/h-j-k-l navigation; DnD intentionally out of current scope.
- **No undo**: Tasks can be recreated if needed; keep operations simple.
- **Hard delete**: lists/tasks are permanently removed; no soft deletes.
- **Error UX**: Disable controls at limits; show inline errors on failures; no toasts or complex flows.
- **Auth**: Google OAuth only; no other providers.
- **Collaboration**: Out of scope; single-user only.
- **Offline**: Not supported; online-only web app.

---

## Coding Standards and Best Practices

**For detailed standards, see `.ai/standards/`:**

- **[Backend Development](.ai/standards/backend-development.md)** - TypeScript, NestJS, logging, testing conventions
- **[Frontend Development](.ai/standards/frontend-development.md)** - React, Astro, Tailwind CSS, accessibility
- **[Validation Workflow](.ai/standards/validation-workflow.md)** - Pre-completion checklist (CRITICAL - must follow before marking tasks complete)
- **[Version Control](.ai/standards/version-control.md)** - Git/GitHub practices
- **[CI/CD](.ai/standards/cicd.md)** - GitHub Actions, Docker best practices

### Quick Reference: Key Principles

**Backend (Expert Level):**
- Clean architecture: adapters → use-cases → repositories
- No "Service" suffix in class names (use `ColorPool`, not `ColorPoolService`)
- Use `AppLogger` for all logging with context
- Test business logic, not TypeScript guarantees
- Avoid `any` type - use explicit types or generics

**Frontend (Beginner-Friendly):**
- Keep components small: 50-80 lines max
- One component per file
- Use functional components with hooks only
- TanStack Query for server state, useState for UI state
- Use shadcn/ui components as-is; customize only when there's a concrete UX reason
- Focus on functionality first, polish later

**Validation (CRITICAL):**
Before marking any task complete, AI agents MUST:
1. Run lint → fix all errors
2. Run typecheck → fix all errors
3. Run build → fix all errors
4. Run tests → fix all failures
5. Format code

**Validation Commands:**
```bash
# Backend
cd apps/backend && pnpm lint && pnpm typecheck && pnpm build && pnpm test

# Frontend
cd apps/frontend && pnpm lint && pnpm typecheck && pnpm build
```

See [.ai/standards/validation-workflow.md](.ai/standards/validation-workflow.md) for complete validation rules.

---

**REMINDER: Code that doesn't pass all validation checks is incomplete code. Incomplete code should never be marked as complete.**
