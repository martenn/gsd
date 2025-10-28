# Task Feature Implementation Plan - GSD

## 1. Feature Overview

The Task feature is the core execution mechanism of GSD. It enables users to:
- Create, edit, delete, and manage tasks across multiple lists
- Move tasks between lists (e.g., from Backlog to Today)
- Complete tasks (marking them as done)
- Reorder tasks within lists to set priority
- Bulk-add tasks via dump mode for quick capture
- Track task metadata (creation time, completion time, origin backlog color)

### Key Constraints
- **Per-list limit**: 100 tasks maximum per list
- **Hard delete**: No soft deletes; deletion is permanent
- **Single ownership**: Each task belongs to exactly one list
- **Ordering**: Tasks inserted at top when created or moved; order_index strategy TBD (fractional vs stepped integers)
- **Visual origin**: Tasks inherit color from origin backlog for visual tracking
- **Done archive**: Completed tasks moved to Done list with completed_at timestamp

### Business Rules
1. New tasks and moved tasks always insert at the top (position 0)
2. Completing a task moves it to the Done list and records completion timestamp
3. Task order is managed via order_index; reordering updates this index
4. Deleting a task is permanent and immediate (hard delete)
5. Tasks can only belong to non-Done lists for creation/editing; only Done list contains completed tasks
6. Dump mode creates max 10 tasks per submission with blank line filtering

---

## 2. Core Domain Model

### Task Entity
```
Task {
  id: UUID (primary key)
  userId: UUID (foreign key to User)
  listId: UUID (foreign key to List)
  originBacklogId: UUID (foreign key to Backlog - for color derivation)

  title: string (1-500 chars, required)
  description: string | null (0-5000 chars, optional)

  orderIndex: decimal | integer (strategy TBD)

  createdAt: DateTime (UTC)
  completedAt: DateTime | null (UTC, null until task completed)

  deletedAt: DateTime | null (for soft delete if reconsidered; null for hard delete)

  Constraints:
  - listId cannot be null
  - userId cannot be null
  - title cannot be empty
  - completedAt must be null when listId != Done
  - max 100 tasks per list (userId, listId)
  - orderIndex must be unique within list
}
```

### Key Relationships
- **Task → List**: Many-to-one; each task belongs to exactly one list
- **Task → User**: Many-to-one; tasks scoped per user
- **Task → Backlog**: Task stores originBacklogId to derive color even after moving to other lists

### Derived Properties
- **isCompleted**: completedAt !== null
- **color**: Inherited from originBacklogId's assigned color
- **listName**: Derived from list relationship

---

## 3. Input Details

### 3.1 Create Task
**Endpoint**: `POST /v1/tasks`

**Request Body** (implements `CreateTaskRequest` from @gsd/types):
```typescript
{
  title: string;              // 1-500 chars, required
  description?: string;       // 0-5000 chars, optional
  listId: UUID;               // target list (must be non-Done)
}
```

**Validation Rules**:
- title: required, string, min 1 char, max 500 chars
- description: optional, string, max 5000 chars
- listId: required, UUID, must exist, must not be Done list
- User must own the target list
- Target list must have < 100 tasks

**Query Parameters**: None

---

### 3.2 Update Task
**Endpoint**: `PATCH /v1/tasks/:id`

**Path Parameters**:
- id: UUID (task to update)

**Request Body** (implements `UpdateTaskRequest` from @gsd/types):
```typescript
{
  title?: string;             // 1-500 chars, optional
  description?: string;       // 0-5000 chars, optional
}
```

**Validation Rules**:
- At least one field must be provided (title or description)
- title: if provided, string, min 1 char, max 500 chars
- description: if provided, string, max 5000 chars (or null to clear)
- Task must not be completed (completedAt must be null)
- User must own the task

**Query Parameters**: None

---

### 3.3 Get Tasks
**Endpoint**: `GET /v1/tasks`

**Query Parameters**:
```
listId?: UUID               // filter by list (required for non-Done lists)
includeCompleted?: boolean  // include tasks from Done list (default: false)
limit?: number              // max results (default: 100, max: 100)
offset?: number             // pagination offset (default: 0)
```

**Validation Rules**:
- If listId provided: must be UUID and user must own the list
- includeCompleted: boolean (defaults to false)
- limit: integer, min 1, max 100
- offset: integer, min 0

---

### 3.4 Delete Task
**Endpoint**: `DELETE /v1/tasks/:id`

**Path Parameters**:
- id: UUID (task to delete)

**Validation Rules**:
- Task must exist
- User must own the task
- No request body

---

### 3.5 Move Task
**Endpoint**: `POST /v1/tasks/:id/move`

**Path Parameters**:
- id: UUID (task to move)

**Request Body** (implements `MoveTaskRequest` from @gsd/types):
```typescript
{
  listId: UUID;               // destination list
}
```

**Validation Rules**:
- id: UUID, must exist, user must own
- listId: UUID, must exist, user must own, must not be Done
- Task must not be completed (completedAt must be null)
- Destination list must have < 100 tasks
- Cannot move task to its current list (redundant operation)

---

### 3.6 Complete Task
**Endpoint**: `POST /v1/tasks/:id/complete`

**Path Parameters**:
- id: UUID (task to complete)

**Request Body**: Empty (no body required)

**Validation Rules**:
- id: UUID, must exist, user must own
- Task must not already be completed (completedAt must be null)
- Task will be moved to Done list automatically

---

### 3.7 Bulk Add Tasks (Dump Mode)
**Endpoint**: `POST /v1/tasks/bulk-add`

**Request Body** (implements `BulkAddTasksRequest` from @gsd/types):
```typescript
{
  tasks: Array<{
    title: string;          // 1-500 chars
    description?: string;   // 0-5000 chars, optional
  }>;
  listId?: UUID;            // default backlog if not provided
}
```

**Validation Rules**:
- tasks: array, min 1 item, max 10 items
- Each task.title: required, string, min 1 char, max 500 chars
- Each task.description: optional, string, max 5000 chars
- Blank/whitespace-only titles are filtered out pre-validation
- listId: optional UUID; if not provided, use user's default backlog
- Duplicates are allowed
- User must own the target list
- Target list must have capacity for all new tasks (current + new ≤ 100)

---

## 4. Output Details

### 4.1 Task DTO Response
**Type**: `TaskDto` (in @gsd/types/api/tasks.ts)
```typescript
{
  id: UUID;
  userId: UUID;
  listId: UUID;
  originBacklogId: UUID;

  title: string;
  description: string | null;

  orderIndex: number | decimal;
  color: string;              // derived from originBacklogId
  isCompleted: boolean;       // derived from completedAt

  createdAt: string;          // ISO 8601 UTC
  completedAt: string | null; // ISO 8601 UTC
}
```

### 4.2 API Response Formats

**Create Task** - `POST /v1/tasks` (201 Created):
```typescript
{
  task: TaskDto;
  message?: string;
}
```

**Update Task** - `PATCH /v1/tasks/:id` (200 OK):
```typescript
{
  task: TaskDto;
  message?: string;
}
```

**Get Tasks** - `GET /v1/tasks` (200 OK):
```typescript
{
  tasks: TaskDto[];
  total: number;              // total count (without pagination)
  limit: number;
  offset: number;
}
```

**Get Single Task** (implied for completeness):
```typescript
{
  task: TaskDto;
}
```

**Delete Task** - `DELETE /v1/tasks/:id` (204 No Content or 200 OK):
```typescript
// 204: No body
// OR 200: { message: "Task deleted" }
```

**Move Task** - `POST /v1/tasks/:id/move` (200 OK):
```typescript
{
  task: TaskDto;  // updated with new listId, orderIndex
}
```

**Complete Task** - `POST /v1/tasks/:id/complete` (200 OK):
```typescript
{
  task: TaskDto;  // updated with completedAt, listId=Done
}
```

**Bulk Add Tasks** - `POST /v1/tasks/bulk-add` (201 Created):
```typescript
{
  tasks: TaskDto[];
  created: number;            // count of tasks created
  failed: number;             // count of tasks that failed
  message?: string;
}
```

---

## 5. Data Flow

### 5.1 Create Task Flow
```
User Request (POST /v1/tasks)
    ↓
Controller: CreateTaskDto validation + auth guard
    ↓
CreateTask Use Case
    ├─ Validate listId exists and user owns it
    ├─ Check list is not Done
    ├─ Check task count < 100 for list
    ├─ Calculate new orderIndex (insert at top)
    ├─ Create task in database via repository
    └─ Return TaskDto
    ↓
Response (201 Created + TaskDto)
```

### 5.2 Update Task Flow
```
User Request (PATCH /v1/tasks/:id)
    ↓
Controller: UpdateTaskDto validation + auth guard
    ↓
UpdateTask Use Case
    ├─ Fetch task from database
    ├─ Verify user ownership
    ├─ Check task not completed
    ├─ Update title and/or description
    ├─ Save to database
    └─ Return TaskDto
    ↓
Response (200 OK + TaskDto)
```

### 5.3 Move Task Flow
```
User Request (POST /v1/tasks/:id/move)
    ↓
Controller: MoveTaskRequest validation + auth guard
    ↓
MoveTask Use Case
    ├─ Fetch task from database
    ├─ Verify user ownership
    ├─ Check task not completed
    ├─ Validate destination list exists and user owns it
    ├─ Check destination list is not Done
    ├─ Check destination list capacity < 100
    ├─ Reindex source list (remove gap in orderIndex)
    ├─ Calculate new orderIndex for destination (insert at top)
    ├─ Update task: listId + orderIndex
    ├─ Save to database
    └─ Return TaskDto
    ↓
Response (200 OK + TaskDto)
```

### 5.4 Complete Task Flow
```
User Request (POST /v1/tasks/:id/complete)
    ↓
Controller: Auth guard
    ↓
CompleteTask Use Case
    ├─ Fetch task from database
    ├─ Verify user ownership
    ├─ Check task not already completed
    ├─ Get Done list for user (or create if not exists)
    ├─ Set completedAt = now (UTC)
    ├─ Move task to Done list
    ├─ Calculate new orderIndex for Done list (insert at top)
    ├─ Reindex source list (remove gap)
    ├─ Save to database
    ├─ Trigger retention cleanup if needed (post-MVP optimization)
    └─ Return TaskDto
    ↓
Response (200 OK + TaskDto)
```

### 5.5 Delete Task Flow
```
User Request (DELETE /v1/tasks/:id)
    ↓
Controller: Auth guard
    ↓
DeleteTask Use Case
    ├─ Fetch task from database
    ├─ Verify user ownership
    ├─ Hard delete task from database
    ├─ Reindex source list (remove gap in orderIndex)
    └─ Return success
    ↓
Response (204 No Content OR 200 OK)
```

### 5.6 Bulk Add Tasks Flow
```
User Request (POST /v1/tasks/bulk-add)
    ↓
Controller: BulkAddTasksDto validation + auth guard
    ↓
BulkAddTasks Use Case
    ├─ Determine target list (provided or default backlog)
    ├─ Validate list exists, user owns it, not Done
    ├─ Filter blank titles from array
    ├─ Check capacity: current tasks + new tasks ≤ 100
    ├─ For each task (in order):
    │   ├─ Create task with calculated orderIndex
    │   ├─ Insert at top (push existing tasks down)
    │   └─ Handle transaction failure
    ├─ Return array of created TaskDto
    └─ Return count of created/failed
    ↓
Response (201 Created + TaskDto[] + counts)
```

### 5.7 Get Tasks Flow
```
User Request (GET /v1/tasks?listId=xxx&limit=20&offset=0)
    ↓
Controller: Query param validation + auth guard
    ↓
GetTasks Use Case
    ├─ Validate listId if provided
    ├─ If listId: fetch from that list (non-Done)
    ├─ If includeCompleted: also fetch from Done list
    ├─ Apply limit/offset pagination
    ├─ Fetch tasks from database ordered by orderIndex DESC
    ├─ Enrich with derived properties (color, isCompleted)
    ├─ Return TaskDto[] with pagination metadata
    └─
Response (200 OK + TaskDto[] + pagination)
```

---

## 6. Security Considerations

### 6.1 Authentication & Authorization
- All task endpoints require authenticated user (JWT in HttpOnly cookie)
- All operations scoped to current user via `req.user.id`
- Verify user ownership before any operation (database query with userId filter)

### 6.2 Data Isolation
- Repository queries must always include `where: { userId }` condition
- Never expose tasks from other users
- API guards should enforce authentication globally

### 6.3 Injection & Validation
- All input validated via DTOs with class-validator decorators
- ListId must be validated to exist and belong to user
- Title/description length limits enforced at DTO level
- UUID format validation for all IDs

### 6.4 List Capacity Abuse
- Enforce 100 task/list limit at use-case level before insertion
- Return 400 Bad Request if limit exceeded
- Disable task creation controls on frontend when limit reached

### 6.5 Move/Complete Operations
- Verify task not already completed before allowing move
- Verify destination list is valid and user owns it
- Prevent moving tasks to Done list directly (only via complete endpoint)

### 6.6 Bulk Operation Safety
- Limit bulk-add to 10 tasks per request
- Validate total capacity before bulk insert
- Use database transaction to ensure all-or-nothing semantics
- Filter out blank titles to prevent empty tasks

---

## 7. Error Handling

### 7.1 Error Scenarios & Status Codes

| Scenario | Status | Error Code | Message |
|----------|--------|-----------|---------|
| Task not found | 404 | TASK_NOT_FOUND | "Task with id {id} not found" |
| User not authorized | 401 | UNAUTHORIZED | "Authentication required" |
| User doesn't own task | 403 | FORBIDDEN | "You don't have permission to access this task" |
| Invalid task ID format | 400 | INVALID_ID | "Invalid task ID format" |
| Invalid list ID format | 400 | INVALID_ID | "Invalid list ID format" |
| List not found | 404 | LIST_NOT_FOUND | "List with id {listId} not found" |
| User doesn't own list | 403 | FORBIDDEN | "You don't have permission to access this list" |
| List is Done list | 400 | INVALID_LIST | "Cannot create/move tasks to Done list directly" |
| List capacity exceeded | 400 | CAPACITY_EXCEEDED | "List has reached maximum task limit (100)" |
| Title missing or empty | 400 | VALIDATION_ERROR | "Task title is required and cannot be empty" |
| Title too long (>500) | 400 | VALIDATION_ERROR | "Task title must not exceed 500 characters" |
| Description too long (>5000) | 400 | VALIDATION_ERROR | "Task description must not exceed 5000 characters" |
| Task already completed | 400 | INVALID_STATE | "Cannot modify a completed task" |
| Task already completed (move) | 400 | INVALID_STATE | "Cannot move a completed task" |
| Task already completed (complete) | 400 | INVALID_STATE | "Task is already completed" |
| Moving to same list | 400 | REDUNDANT_OPERATION | "Task is already in the target list" |
| Bulk add: no tasks provided | 400 | VALIDATION_ERROR | "At least one task must be provided" |
| Bulk add: too many tasks (>10) | 400 | VALIDATION_ERROR | "Maximum 10 tasks allowed per bulk add request" |
| Bulk add: capacity exceeded | 400 | CAPACITY_EXCEEDED | "Not enough capacity to add all tasks" |
| Database transaction failed | 500 | DATABASE_ERROR | "Failed to save task. Please try again." |
| Unknown error | 500 | INTERNAL_ERROR | "An unexpected error occurred" |

### 7.2 Error Response Format
```typescript
{
  error: {
    code: string;           // error code (e.g., TASK_NOT_FOUND)
    message: string;        // user-friendly message
    statusCode: number;     // HTTP status code
    timestamp: string;      // ISO 8601 timestamp
    path?: string;          // request path (optional for debugging)
  }
}
```

### 7.3 Logging Strategy
- Log all errors with context: userId, taskId, listId, operation
- Use structured logging (pino or built-in NestJS logger)
- Log at appropriate levels:
  - **WARN**: 400-level errors (validation, auth failures)
  - **ERROR**: 500-level errors (database, server failures)
- Include stack traces for 500 errors (development only)

---

## 8. Performance Considerations

### 8.1 Database Indexing
```sql
CREATE INDEX idx_task_user_id ON task(user_id);
CREATE INDEX idx_task_list_id ON task(list_id);
CREATE INDEX idx_task_completed_at ON task(completed_at);
CREATE INDEX idx_task_order_index ON task(list_id, order_index DESC);
CREATE INDEX idx_task_user_list ON task(user_id, list_id);
```

### 8.2 Query Optimization
- **Get tasks**: Use indexed query on (user_id, list_id) with orderIndex DESC ordering
- **Move/complete**: Batch reindex operations where possible
- **Bulk add**: Use transaction to minimize round-trips

### 8.3 Order Index Strategy (TBD)
Currently open question: fractional vs stepped integers for orderIndex

**Fractional approach**:
- Use decimal(10,6) or similar
- Insert new tasks at 0.5 (middle between existing indices)
- Avoids reindexing until indices converge
- Complex decimal arithmetic; potential precision issues

**Stepped integers approach**:
- Use integer with step size (e.g., 1000 between items)
- New task at current_index + 500
- Simpler integer math
- Requires periodic reindexing when spacing exhausted
- Recommended for MVP due to simplicity

**Recommendation**: Use stepped integers (1000-step) with periodic reindexing job

### 8.4 N+1 Query Prevention
- Use database joins to fetch related data in single query
- Eager load originBacklog when fetching tasks (for color derivation)
- Lazy load list details if not needed in response

### 8.5 Pagination
- Default limit: 20 tasks (configurable, max 100)
- Use offset/limit for pagination (not keyset due to reordering)
- Cache frequently accessed lists in memory (post-MVP optimization)

### 8.6 Caching Strategy (Post-MVP)
- Cache task list per (userId, listId) with TTL of 5-10 seconds
- Invalidate on create/update/move/complete
- Consider Redis for distributed caching

---

## 9. Architecture & Implementation Details

### 9.1 Module Structure

```
apps/backend/src/tasks/
├── adapters/
│   └── tasks.controller.ts              # REST endpoints
├── use-cases/
│   ├── create-task.ts
│   ├── update-task.ts
│   ├── get-tasks.ts
│   ├── delete-task.ts
│   ├── move-task.ts
│   ├── complete-task.ts
│   ├── bulk-add-tasks.ts
│   └── *.spec.ts                        # unit tests
├── infra/
│   ├── tasks.repository.ts              # database operations
│   └── order-index.helper.ts            # orderIndex calculations
├── dto/
│   ├── create-task.dto.ts
│   ├── update-task.dto.ts
│   ├── move-task.dto.ts
│   ├── bulk-add-tasks.dto.ts
│   └── get-tasks-query.dto.ts
├── guards/
│   └── task-ownership.guard.ts          # verify user owns task
└── tasks.module.ts
```

### 9.2 Repository Interface
```typescript
// infra/tasks.repository.ts
export interface ITasksRepository {
  // CRUD
  create(userId: string, data: CreateTaskInput): Promise<Task>;
  findById(userId: string, taskId: string): Promise<Task | null>;
  findManyByList(userId: string, listId: string, options?: PaginationOptions): Promise<Task[]>;
  update(userId: string, taskId: string, data: UpdateTaskInput): Promise<Task>;
  delete(userId: string, taskId: string): Promise<void>;

  // Batch operations
  findManyByIds(userId: string, taskIds: string[]): Promise<Task[]>;
  deleteMany(userId: string, taskIds: string[]): Promise<number>; // count deleted

  // Order management
  reindexListTasks(userId: string, listId: string): Promise<void>;

  // Counting
  countByList(userId: string, listId: string): Promise<number>;
}
```

### 9.3 Use Case Structure
Each use case follows single responsibility:
```typescript
@Injectable()
export class CreateTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
  ) {}

  async execute(userId: string, input: CreateTaskInput): Promise<TaskDto> {
    // Validation logic
    // Business logic
    // Repository calls
    // DTO transformation
    return taskDto;
  }
}
```

### 9.4 Controller Structure
Controllers are thin adapters:
```typescript
@Controller('v1/tasks')
export class TasksController {
  constructor(
    private readonly createTaskUseCase: CreateTask,
    private readonly updateTaskUseCase: UpdateTask,
    // ... other use cases
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async createTask(
    @Request() req,
    @Body() dto: CreateTaskDto,
  ): Promise<CreateTaskResponseDto> {
    const task = await this.createTaskUseCase.execute(req.user.id, dto);
    return { task };
  }

  // ... other endpoints
}
```

---

## 10. Implementation Steps (Incremental Sub-Features)

### Phase 1: Core Task CRUD & Database
1. **Create Prisma schema** for Task entity with indexes
2. **Create DTOs** for all task operations (@gsd/types and backend)
3. **Create TasksRepository** with all database methods
4. **Create basic use cases**: CreateTask, UpdateTask, GetTasks, DeleteTask
5. **Create TasksController** with CRUD endpoints
6. **Add tests** for repository and use cases

### Phase 2: Task Ordering & Movement
7. **Create order-index.helper.ts** for orderIndex calculations
8. **Create MoveTask use case** with reindexing logic
9. **Add move endpoint** to controller
10. **Create TaskOwnershipGuard** for authorization
11. **Add tests** for move operation and reindexing

### Phase 3: Task Completion & Done List
12. **Create CompleteTask use case** with Done list handling
13. **Add complete endpoint** to controller
14. **Ensure originBacklogId tracking** for color derivation
15. **Add tests** for completion flow

### Phase 4: Bulk Operations & Advanced Features
16. **Create BulkAddTasks use case** with transaction support
17. **Add bulk-add endpoint** to controller
18. **Add validation** for 10-task limit and blank line filtering
19. **Add tests** for bulk operations

### Phase 5: Integration & Refinement
20. **Integration tests** for complete workflows
21. **Performance testing** at limits (100 tasks/list)
22. **Error handling** comprehensive testing
23. **API documentation** via Swagger decorators
24. **Frontend integration** - ensure DTO contracts match

---

## 11. Database Schema (Prisma)

```prisma
model Task {
  id        String   @id @default(uuid())
  userId    String   @db.Uuid
  listId    String   @db.Uuid
  originBacklogId String @db.Uuid  // for color derivation

  title       String  @db.VarChar(500)
  description String? @db.VarChar(5000)

  orderIndex  Int     // 1000-step strategy for reordering

  createdAt   DateTime  @default(now()) @db.Timestamp
  completedAt DateTime? @db.Timestamp

  // Relations
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  list        List    @relation(fields: [listId], references: [id])
  originBacklog Backlog @relation(fields: [originBacklogId], references: [id])

  // Indexes
  @@index([userId])
  @@index([listId])
  @@index([userId, listId])
  @@index([completedAt])
  @@index([listId, orderIndex])
  @@unique([listId, orderIndex])  // ensure no duplicate order indices per list
}
```

---

## 12. Known Open Questions

1. **Order Index Strategy**: Fractional vs stepped integers - recommendation: stepped integers (1000-step)
2. **Reindexing Schedule**: When to trigger periodic reindexing job - post-MVP optimization
3. **Soft vs Hard Delete**: Currently hard delete; consider soft delete for audit trail (post-MVP)
4. **Undo Feature**: Currently not supported; can be added post-MVP
5. **Task Dependencies**: Not in MVP; consider for future phases
6. **Task Estimates/Durations**: Not in MVP scope
7. **Recurring Tasks**: Not in MVP scope
8. **Task Templates**: Not in MVP scope

---

## Next Steps

This plan covers the entire task feature with all endpoints and business logic. The implementation is broken into 5 phases with incrementally buildable sub-features.

**Ready to proceed?** Confirm which phase/sub-feature to implement first, and I'll create detailed step-by-step implementation guidance.
