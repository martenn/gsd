# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Meta-Rules for Claude Code

**IMPORTANT:** When architectural patterns, coding standards, or rules are established or changed during a conversation:
1. Always update CLAUDE.md with the new rule/pattern (this file)
2. Always update the corresponding `.cursor/rules/*.mdc` file(s)
3. Both files must stay in sync
4. Changes should be made in the same response/action

This ensures consistency across all development tools and documentation.

## Project Overview

**GSD (Getting Shit Done)** is a focused personal productivity app inspired by GTD. It helps solo users plan and execute work using multiple user-managed backlogs, intermediate lists, and a focused work mode. The MVP targets responsive web (desktop and mobile), single-user accounts, with Google OAuth authentication.

**Current Status**: Monorepo bootstrapped with basic infrastructure. Ready for feature implementation.

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
- **Monorepo**: pnpm workspaces (no Turborepo - kept simple)

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

### Backend Architecture Pattern

**Module Structure (Clean Architecture with Use Cases and Repository):**

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

1. **Adapters** (HTTP layer)
   - Controllers only; delegate to use cases
   - No business logic
   - Use case dependencies named with `UseCase` suffix (e.g., `getListsUseCase: GetLists`)
   - Method names follow OpenAPI operationId convention

2. **Use Cases** (Business logic layer)
   - One class per operation
   - Named without suffix (e.g., `GetLists`, `CreateList`)
   - Single `execute()` method
   - Depends on repositories, NOT PrismaClient
   - Contains business rules and orchestration
   - No database queries

3. **Infrastructure** (Database layer)
   - Repositories encapsulate all Prisma operations
   - Named `{Domain}Repository` (e.g., `ListsRepository`)
   - Returns Prisma entities
   - No business logic

4. **Module Rules:**
   - No `index.ts` file (module exports itself)
   - Export only the module, not internal classes
   - Cross-domain dependencies TBD

**Feature Separation:**
- Each feature should have its own folder: `/src/{feature}/`
- Features should not mix concerns - keep color management separate from list management
- Cross-feature dependencies should be explicit through module imports
- Export only what other features need, not internal implementation details
- Keep services focused on single responsibility
- Use dependency injection for cross-feature services
- Avoid circular dependencies between features

**Example:**

```typescript
// infra/lists.repository.ts
@Injectable()
export class ListsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByUserId(userId: string): Promise<List[]> {
    return this.prisma.list.findMany({ where: { userId } });
  }
}

// use-cases/get-lists.ts
@Injectable()
export class GetLists {
  constructor(private readonly repository: ListsRepository) {}

  async execute(userId: string): Promise<ListDto[]> {
    const lists = await this.repository.findManyByUserId(userId);
    return lists.map(list => this.toDto(list));
  }
}

// adapters/lists.controller.ts
@Controller('v1/lists')
export class ListsController {
  constructor(private readonly getListsUseCase: GetLists) {}

  @Get()
  async getLists(): Promise<GetListsResponseDto> {
    const lists = await this.getListsUseCase.execute('user-id');
    return { lists };
  }
}
```

### DTO Architecture Pattern

**Request/Response Type Sharing Strategy:**

```
@gsd/types/api/*.ts          → Shared interfaces (frontend + backend)
  - Request interfaces (e.g., CreateListRequest)
  - Response DTOs (e.g., ListDto, GetListsResponseDto)

apps/backend/src/*/dto/*.ts  → Backend-only classes
  - Request classes implement shared interfaces
  - Add class-validator decorators for runtime validation
```

**Example:**

```typescript
// @gsd/types/api/lists.ts (shared)
export interface CreateListRequest {
  name: string;
  isBacklog?: boolean;
  color?: string;
}

// apps/backend/src/lists/dto/create-list.dto.ts (backend only)
import { CreateListRequest } from '@gsd/types';

export class CreateListDto implements CreateListRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsBoolean()
  @IsOptional()
  isBacklog?: boolean;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string;
}
```

**Rationale:**
- Frontend gets pure TypeScript interfaces (no class-validator dependency)
- Backend maintains full runtime validation control via class-validator
- Type safety enforced between frontend requests and backend expectations
- Single source of truth for API contracts

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

---

## Coding Standards and Best Practices

The following coding standards are automatically enforced for specific file types. These rules are sourced from `.cursor/rules/` and should be followed when working with the codebase.

### Backend Development (TypeScript)

**Support Level: EXPERT**
- Favor elegant, maintainable solutions with verbose code. Assume understanding of language idioms and design patterns.
- Highlight potential performance implications and optimization opportunities in suggested code.
- Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.
- Focus comments on 'why' not 'what' - assume code readability through well-named functions and variables.
- Proactively address edge cases, race conditions, and security considerations without being prompted.
- When debugging, provide targeted diagnostic approaches rather than shotgun solutions.
- Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.

**TypeScript Best Practices**:
- Avoid using `any` type - prefer explicit types or generics
- Use strict mode in TypeScript configuration

**Code Documentation**:
- Don't use JSDoc or similar documentation comments, unless specifically requested
- Avoid inline comments that state the obvious (e.g., `// Blue` next to color codes)
- Let well-named functions and variables be self-documenting
- Focus on "why" not "what" when comments are necessary

**Naming Conventions**:
- Avoid "Service" suffix in class names - use descriptive names instead
  - Examples: `ColorPool` instead of `ColorPoolService`, `ScanUsedColors` instead of `ColorScanService`
  - Class names should clearly indicate their primary responsibility
  - Use descriptive method names that explain intent
- File naming conventions:
  - Match file names to class names: `color-pool.ts` for `ColorPool` class
  - Use kebab-case for file names: `scan-used-colors.ts` not `scanUsedColors.ts`
  - Test files should mirror source files: `color-pool.spec.ts` for `color-pool.ts`

**NestJS Best Practices**:
- Use dependency injection for services to improve testability and maintainability following SOLID principles
- Implement custom decorators for cross-cutting concerns to keep code DRY and maintain separation of business logic
- Use interceptors for transforming the response data structure consistently
- Leverage NestJS Guards for authorization to centralize access control logic across all resources
- Implement domain-driven design with modules that encapsulate related functionality and maintain clear boundaries
- Use Prisma with repository patterns to abstract database operations and simplify testing with mocks

**Testing Conventions**:
- Test files should mirror source file names: `{feature}.spec.ts`
- Use descriptive test descriptions that explain behavior
- Group related tests in describe blocks
- Test the public API, not internal implementation
- Use meaningful test names that describe expected behavior
- Keep tests focused and atomic
- Use dependency injection to mock external dependencies

**Docker Best Practices**:
- Use multi-stage builds to create smaller production images
- Use non-root users in containers for better security

### Frontend Development (React/Astro)

**React Coding Standards**:
- Use functional components with hooks instead of class components
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Use the new use hook for data fetching in React 19+ projects
- Leverage Server Components for data-fetching-heavy components when using React with Next.js or similar frameworks
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

**Tailwind CSS Best Practices**:
- Use the @layer directive to organize styles into components, utilities, and base layers
- Implement Just-in-Time (JIT) mode for development efficiency and smaller CSS bundles
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Leverage the @apply directive in component classes to reuse utility combinations
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Use component extraction for repeated UI patterns instead of copying utility classes
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus:, active:, etc.) for interactive elements

**Astro Coding Standards**:
- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed
- Leverage View Transitions API for smooth page transitions
- Use content collections with type safety for blog posts, documentation, etc.
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Leverage Server Endpoints for API routes
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables

**Accessibility (ARIA) Standards**:
- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set aria-expanded and aria-controls for expandable content like accordions and dropdowns
- Use aria-live regions with appropriate politeness settings for dynamic content updates
- Implement aria-hidden to hide decorative or duplicative content from screen readers
- Apply aria-label or aria-labelledby for elements without visible text labels
- Use aria-describedby to associate descriptive text with form inputs or complex elements
- Implement aria-current for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements
- Apply aria-invalid and appropriate error messaging for form validation

### Version Control & Git Practices

**Git Standards**:
- Use conventional commits to create meaningful commit messages
- Use feature branches with descriptive names
- Write meaningful commit messages that explain why changes were made, not just what
- Keep commits focused on single logical changes to facilitate code review and bisection
- Use interactive rebase to clean up history before merging feature branches
- Leverage git hooks to enforce code quality checks before commits and pushes

**GitHub Standards**:
- Use pull request templates to standardize information provided for code reviews
- Implement branch protection rules to enforce quality checks
- Configure required status checks to prevent merging code that fails tests or linting
- Use GitHub Actions for CI/CD workflows to automate testing and deployment
- Implement CODEOWNERS files to automatically assign reviewers based on code paths
- Use GitHub Projects for tracking work items and connecting them to code changes

### Documentation Standards

- Update relevant documentation in /docs when modifying features
- Keep README.md in sync with new capabilities
- Maintain changelog entries in CHANGELOG.md

### CI/CD Best Practices (GitHub Actions)

- Check if `package.json` exists in project root and summarize key scripts
- Check if `.nvmrc` exists in project root
- Check if `.env.example` exists in project root to identify key environment variables
- Always use terminal command: `git branch -a | cat` to verify whether we use `main` or `master` branch
- Always use `env:` variables and secrets attached to jobs instead of global workflows
- Always use `npm ci` for Node-based dependency setup
- Extract common steps into composite actions in separate files
- For each public action always use the most up-to-date version (use only major version)

### DevOps & Containerization

**Containerization (Docker)**:
- Use multi-stage builds to create smaller production images
- Use non-root users in containers for better security
