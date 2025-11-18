# Backend Gap Analysis - GSD MVP

Comparison of PRD requirements vs current backend implementation.

## ✅ Implemented Features

### Lists Module

- ✅ **GET /v1/lists** - Fetch all non-Done lists for user
- ✅ **POST /v1/lists** - Create new list with color assignment
- ✅ **DELETE /v1/lists/:id** - Delete list with task destination (with backlog constraint logic)

### Tasks Module

- ✅ **GET /v1/tasks** - Fetch tasks by list with pagination
- ✅ **POST /v1/tasks** - Create task in list (inserts at top)
- ✅ **PATCH /v1/tasks/:id** - Update task title/description
- ✅ **DELETE /v1/tasks/:id** - Hard delete task

### Infrastructure

- ✅ Color management system (ColorPool with singleton pattern)
- ✅ Logging infrastructure (AppLogger, HTTP interceptor)
- ✅ Repository pattern with Prisma
- ✅ Use case architecture (clean architecture)
- ✅ Validation (class-validator DTOs)
- ✅ Database schema (User, List, Task models)

## ❌ Missing Critical Features

### 1. Authentication Module (HIGH PRIORITY)

**PRD Section:** 3.7 Authentication and Account

**Required:**

- Google OAuth 2.0 integration (@nestjs/passport + passport-google-oauth20)
- JWT session management (HttpOnly cookies)
- Sign-in/sign-out endpoints
- User model and creation
- Auth guards for all protected routes

**Endpoints Needed:**

```
POST /auth/google         - Initiate Google OAuth flow
GET /auth/google/callback - OAuth callback handler
POST /auth/signout        - End user session
GET /auth/me             - Get current user info
```

**Current Status:** 🔴 Not started

- Controllers hardcode `userId = 'mock-user-id'`
- No authentication guards
- No session management

---

### 2. List Management - Missing Operations (MEDIUM PRIORITY)

**PRD Sections:** 3.1 Lists and Board, US-002, US-004, US-001A

#### a) Update List (Rename)

**Required:**

- **PATCH /v1/lists/:id** - Update list name

**Use Case:** `UpdateList`

```typescript
execute(userId: string, listId: string, dto: UpdateListDto): Promise<ListDto>
```

**Current Status:** 🔴 Not implemented

#### b) Reorder Lists

**Required:**

- **POST /v1/lists/:id/reorder** - Change list position (orderIndex)

**Use Case:** `ReorderList`

```typescript
execute(userId: string, listId: string, dto: ReorderListDto): Promise<void>
// dto: { newOrderIndex: number } or { afterListId: string }
```

**Current Status:** 🔴 Not implemented

#### c) Toggle Backlog Status

**Required:**

- **POST /v1/lists/:id/toggle-backlog** - Mark/unmark list as backlog

**Use Case:** `ToggleBacklog`

```typescript
execute(userId: string, listId: string): Promise<ListDto>
```

**Business Rules:**

- Cannot unmark if it's the last backlog
- Backlog lists maintain leftmost position
- Visual grouping in UI (backend provides isBacklog flag)

**Current Status:** 🔴 Not implemented

---

### 3. Task Management - Missing Operations (HIGH PRIORITY)

**PRD Sections:** 3.2 Tasks, US-008, US-009, US-010, US-011

#### a) Move Task Between Lists

**Required:**

- **POST /v1/tasks/:id/move** - Move task to different list

**Use Case:** `MoveTask`

```typescript
execute(userId: string, taskId: string, dto: MoveTaskDto): Promise<TaskDto>
// dto: { targetListId: string }
```

**Business Rules:**

- Task inserted at top of target list
- Cannot move to Done list (use complete instead)
- Task limit validation (100 per list)

**Current Status:** 🔴 Not implemented

#### b) Reorder Task Within List

**Required:**

- **POST /v1/tasks/:id/reorder** - Change task position within same list

**Use Case:** `ReorderTask`

```typescript
execute(userId: string, taskId: string, dto: ReorderTaskDto): Promise<void>
// dto: { newOrderIndex: number } or { afterTaskId: string }
```

**Current Status:** 🔴 Not implemented

#### c) Complete Task

**Required:**

- **POST /v1/tasks/:id/complete** - Mark task complete (moves to Done)

**Use Case:** `CompleteTask`

```typescript
execute(userId: string, taskId: string): Promise<void>
```

**Business Rules:**

- Sets `completedAt` timestamp (UTC)
- Moves task to Done list
- Updates task's listId to Done list ID

**Current Status:** 🔴 Not implemented

#### d) Bulk Add Tasks (Dump Mode)

**Required:**

- **POST /v1/tasks/bulk-add** - Create multiple tasks from text input

**Use Case:** `BulkAddTasks`

```typescript
execute(userId: string, dto: BulkAddTasksDto): Promise<BulkAddTasksResponseDto>
// dto: { lines: string[], targetListId?: string }
```

**Business Rules:**

- Max 10 lines per submission
- Blank lines removed
- Duplicates allowed
- All tasks go to default backlog (or specified list)
- All inserted at top in order

**Current Status:** 🟡 Partially implemented

- DTO exists (`bulk-add-tasks.dto.ts`)
- Not wired to controller
- Use case not implemented

---

### 4. Done View Module (MEDIUM PRIORITY)

**PRD Section:** 3.5 Done View, US-015

**Required:**

- **GET /v1/done** - Paginated completed tasks view

**Endpoints:**

```
GET /v1/done?page=1&limit=50
```

**Use Case:** `GetDoneTasks`

```typescript
execute(userId: string, query: GetDoneTasksQueryDto): Promise<GetDoneTasksResponseDto>
```

**Business Rules:**

- Pagination: 50 items per page (default)
- Reverse chronological order (completedAt DESC)
- Retention: Keep last N=500 completed tasks per user
- Automatic cleanup of older tasks

**Additional Use Case:** `CleanupOldDoneTasks` (scheduled job)

```typescript
execute(userId: string): Promise<void>
```

**Current Status:** 🔴 Not implemented

- No Done controller
- No use cases
- No retention job

---

### 5. Metrics Module (LOW PRIORITY)

**PRD Section:** 3.8 Metrics, US-016

**Required:**

- **GET /v1/metrics/daily** - Daily completion counts
- **GET /v1/metrics/weekly** - Weekly completion counts (week starts Monday)

**Use Cases:**

```typescript
GetDailyMetrics.execute(userId: string, query: DateRangeQueryDto): Promise<DailyMetricsResponseDto>
GetWeeklyMetrics.execute(userId: string, query: DateRangeQueryDto): Promise<WeeklyMetricsResponseDto>
```

**Business Rules:**

- Timestamps stored in UTC
- Rendered in user's local timezone (frontend responsibility)
- Week starts Monday
- Aggregate from completedAt field

**Current Status:** 🔴 Not implemented

---

### 6. Health/Maintenance Module (LOW PRIORITY)

**PRD Implied:** Infrastructure requirements

**Required:**

- **GET /health** - Liveness probe
- **GET /health/ready** - Readiness probe (DB connectivity check)

**Current Status:** 🔴 Not implemented

---

## 🟡 Partial/Needs Enhancement

### 1. List Deletion with Backlog Constraint

**Current:** DeleteList use case exists with some logic
**Needs:**

- ✅ Backlog count validation
- ✅ Auto-promotion of intermediate to backlog
- ❓ Better error messages for constraint violations

### 2. Task Creation

**Current:** CreateTask exists and inserts at top
**Needs:**

- ✅ List capacity validation (100 tasks)
- ✅ Cannot create in Done list
- ❓ Origin backlog tracking for color (currently hardcoded)

### 3. Task Fetching

**Current:** GetTasks exists with basic filtering
**Needs:**

- ✅ List-based filtering
- ✅ Pagination (limit/offset)
- ❌ includeCompleted filter (mentioned in PRD for plan mode)

---

## Implementation Priority

### Phase 1: Authentication (BLOCKER)

1. AuthModule with Google OAuth
2. JWT session management
3. Auth guards on all routes
4. Replace mock userId in controllers

### Phase 2: Core Task Flow (MVP CRITICAL)

1. CompleteTask (move to Done)
2. MoveTask (between lists)
3. ReorderTask (within list)
4. UpdateList (rename)
5. ToggleBacklog

### Phase 3: Done & Retention (MVP REQUIRED)

1. DoneModule with GetDoneTasks
2. Retention job (cleanup old tasks)
3. ReorderList

### Phase 4: Enhanced Features (MVP NICE-TO-HAVE)

1. BulkAddTasks (dump mode)
2. MetricsModule
3. Health endpoints

---

## Technical Debt Notes

1. **Mock User ID:** All controllers use hardcoded `userId = 'mock-user-id'` - must be replaced with authenticated user from JWT/session

2. **Done List Initialization:** Need to ensure Done list is created on user onboarding

3. **Origin Backlog Tracking:** Tasks currently hardcode color `#3B82F6` - should track originBacklogId and derive color

4. **Order Index Strategy:** Current implementation uses simple incrementing - may need fractional indexing for better reordering

5. **Scheduled Jobs:** Need @nestjs/schedule integration for retention cleanup

6. **Error Handling:** Current implementation throws exceptions - frontend needs consistent error format

---

## Estimated Effort

| Feature                     | Effort   | Dependencies                   |
| --------------------------- | -------- | ------------------------------ |
| Authentication Module       | 3-5 days | Google OAuth setup, JWT config |
| Complete/Move/Reorder Tasks | 2-3 days | None                           |
| Update/Reorder/Toggle Lists | 1-2 days | None                           |
| Done View + Retention       | 2-3 days | Scheduler setup                |
| Bulk Add Tasks              | 1 day    | None                           |
| Metrics Module              | 2-3 days | Date/timezone handling         |
| Health Module               | 0.5 day  | None                           |

**Total Estimated:** 12-17 days for full MVP backend

---

## Next Steps

1. **Immediate:** Implement Authentication Module (blocks everything)
2. **Next:** Complete task flow operations (CompleteTask, MoveTask, ReorderTask)
3. **Then:** List management operations (UpdateList, ToggleBacklog, ReorderList)
4. **Finally:** Done view, retention, metrics, health

---

## Open Questions

1. **Default Backlog Selection:** How is "default backlog" determined for bulk-add? First backlog by orderIndex?

2. **Done List Creation:** When is Done list created? On user registration? Hidden from board but still in DB?

3. **Active Work List:** Backend needs to identify "rightmost non-Done list" for work mode? Or frontend responsibility?

4. **Origin Backlog Tracking:** Add originBacklogId field to Task model or derive from current listId history?

5. **Onboarding Flow:** Who creates initial lists (Backlog + Today + Done)? Backend on user creation or frontend after first login?
