# Feature Implementation Plan: Task Bulk-Add (Dump Mode)

## 1. Feature Overview

This plan covers the implementation of the **Dump Mode** feature - a quick multi-line task creation endpoint that allows users to rapidly add multiple tasks at once.

**Endpoint:** `POST /v1/tasks/bulk-add`

**Purpose:** Enable users to quickly dump multiple task ideas into their default backlog without the overhead of individual task creation API calls. This supports the "brain dump" workflow where users need to capture tasks quickly.

### Business Context (US-014)

> **User Story US-014: Dump mode quick add**
> As a user, I can paste or type multiple lines to quickly add tasks to the default backlog.
>
> **Acceptance Criteria:**
> - Up to 10 non-empty lines create up to 10 tasks at the top of the default backlog
> - Blank lines are ignored; duplicates are allowed

**Key Features:**
- Accept up to 10 tasks in a single request
- Insert all tasks at the top of the target list (default backlog if not specified)
- Blank lines are filtered out automatically
- Duplicate titles are allowed (no deduplication)
- All tasks created with the same timestamp and sequential orderIndex
- Atomic operation: all tasks succeed or all fail (transaction)

## 2. Current Implementation Status

**Already Implemented:**
- ✅ `BulkAddTasksDto` in `apps/backend/src/tasks/dto/bulk-add-tasks.dto.ts`
- ✅ `CreateTask` use case (for individual task creation)
- ✅ `TasksRepository` with Prisma operations
- ✅ `TasksController` with authentication guards
- ✅ Shared types in `@gsd/types/api/tasks.ts`

**Missing:**
- ❌ `BulkAddTasks` use case implementation
- ❌ Controller endpoint `POST /v1/tasks/bulk-add`
- ❌ Integration with default backlog selection logic
- ❌ Transaction handling for atomic bulk insertion

**Database Schema (Task model):**
```prisma
model Task {
  id          String    @id @default(uuid())
  title       String
  description String?
  orderIndex  Float     @map("order_index")
  listId      String    @map("list_id")
  userId      String    @map("user_id")
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId, listId, orderIndex])
}
```

**Note:** The schema shows that tasks don't have `originBacklogId` or `color` fields yet. These are mentioned in `TaskDto` but may be computed/derived fields rather than persisted. This should be clarified or the schema updated.

## 3. Inputs

### Path
`POST /v1/tasks/bulk-add`

### Request Body
```typescript
{
  "tasks": [
    {
      "title": "Task title 1",
      "description": "Optional description"
    },
    {
      "title": "Task title 2"
    }
  ],
  "listId": "uuid-optional" // Defaults to user's default backlog if omitted
}
```

**Parameters:**
- **Required:**
  - `tasks` (array): Array of task objects, 1-10 items
    - `title` (string): Task title, 1-500 characters
    - `description` (string, optional): Task description, max 5000 characters

- **Optional:**
  - `listId` (UUID): Target list ID. If omitted, uses the user's default backlog

**Validation (already in BulkAddTasksDto):**
```typescript
export class BulkAddTasksDto implements BulkAddTasksRequest {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one task must be provided' })
  @ArrayMaxSize(10, { message: 'Maximum 10 tasks allowed per bulk add request' })
  @ValidateNested({ each: true })
  @Type(() => BulkTaskInput)
  tasks: BulkTaskInput[];

  @IsUUID('4', { message: 'Invalid list ID format' })
  @IsOptional()
  listId?: string;
}

class BulkTaskInput {
  @IsString()
  @MinLength(1, { message: 'Task title cannot be empty' })
  @MaxLength(500, { message: 'Task title must not exceed 500 characters' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'Task description must not exceed 5000 characters' })
  description?: string;
}
```

### User Context
- User ID extracted from JWT via `@CurrentUser()` decorator

## 4. Outputs

### Success Response (201 Created)
```typescript
{
  "tasks": [
    {
      "id": "uuid",
      "userId": "uuid",
      "listId": "uuid",
      "originBacklogId": "uuid",
      "title": "Task title 1",
      "description": "Optional description",
      "orderIndex": 100.5,
      "color": "#3B82F6",
      "isCompleted": false,
      "createdAt": "2025-11-15T10:00:00Z",
      "completedAt": null
    },
    // ... more tasks
  ],
  "created": 2,
  "failed": 0,
  "message": "Successfully created 2 tasks"
}
```

### Response Type (already defined)
```typescript
export interface BulkAddTasksResponseDto {
  tasks: TaskDto[];
  created: number;
  failed: number;
  message?: string;
}
```

### Error Responses

**400 Bad Request:**
- Invalid input validation (empty title, too many tasks, etc.)
- List has reached 100 task limit
- Cannot add to Done list
```json
{
  "statusCode": 400,
  "message": "Maximum 10 tasks allowed per bulk add request",
  "error": "Bad Request"
}
```

**401 Unauthorized:**
- Missing or invalid JWT token

**403 Forbidden:**
- List belongs to different user
```json
{
  "statusCode": 403,
  "message": "List not found or access denied",
  "error": "Forbidden"
}
```

**404 Not Found:**
- Specified listId doesn't exist
- User has no default backlog (edge case, should not happen in normal operation)
```json
{
  "statusCode": 404,
  "message": "Target list not found",
  "error": "Not Found"
}
```

**500 Internal Server Error:**
- Database transaction failure
- Unexpected server errors

## 5. Data Flow

### High-Level Flow
1. Client sends POST /v1/tasks/bulk-add with array of tasks
2. Controller validates DTO (class-validator)
3. Controller extracts user ID from JWT
4. Controller calls BulkAddTasks use case
5. Use case determines target list (provided listId or default backlog)
6. Use case validates list ownership and constraints
7. Use case calculates orderIndex values for new tasks (all at top)
8. Use case inserts all tasks in a Prisma transaction
9. Use case returns array of created TaskDtos
10. Controller returns 201 with BulkAddTasksResponseDto

### Detailed Flow

```
┌─────────┐      ┌────────────┐      ┌──────────────┐      ┌────────────────┐
│ Client  │      │ Controller │      │ BulkAddTasks │      │ TasksRepository│
│         │      │            │      │   Use Case   │      │                │
└────┬────┘      └─────┬──────┘      └──────┬───────┘      └───────┬────────┘
     │                 │                    │                      │
     │ POST /bulk-add  │                    │                      │
     ├────────────────>│                    │                      │
     │                 │                    │                      │
     │                 │ Validate DTO       │                      │
     │                 │ Extract User ID    │                      │
     │                 │                    │                      │
     │                 │ execute(userId,dto)│                      │
     │                 ├───────────────────>│                      │
     │                 │                    │                      │
     │                 │                    │ Determine target     │
     │                 │                    │ list (default or     │
     │                 │                    │ provided)            │
     │                 │                    │                      │
     │                 │                    │ findOneByIdAndUser() │
     │                 │                    ├─────────────────────>│
     │                 │                    │<─────────────────────┤
     │                 │                    │  List entity         │
     │                 │                    │                      │
     │                 │                    │ Validate:            │
     │                 │                    │ - not Done           │
     │                 │                    │ - space available    │
     │                 │                    │                      │
     │                 │                    │ getMaxOrderIndex()   │
     │                 │                    ├─────────────────────>│
     │                 │                    │<─────────────────────┤
     │                 │                    │  max orderIndex      │
     │                 │                    │                      │
     │                 │                    │ Calculate new        │
     │                 │                    │ orderIndex for each  │
     │                 │                    │                      │
     │                 │                    │ bulkCreate()         │
     │                 │                    │ (in transaction)     │
     │                 │                    ├─────────────────────>│
     │                 │                    │<─────────────────────┤
     │                 │                    │  Created tasks       │
     │                 │                    │                      │
     │                 │ BulkAddTasksDto    │                      │
     │                 │<───────────────────┤                      │
     │                 │                    │                      │
     │ 201 Created     │                    │                      │
     │<────────────────┤                    │                      │
     │ Response        │                    │                      │
     │                 │                    │                      │
```

### Algorithm Details

**Step 1: Determine Target List**
```typescript
let targetListId: string;

if (dto.listId) {
  // Use provided list
  targetListId = dto.listId;
} else {
  // Find user's default backlog (first backlog ordered by orderIndex)
  const defaultBacklog = await this.listsRepository.findDefaultBacklog(userId);
  if (!defaultBacklog) {
    throw new NotFoundException('No default backlog found');
  }
  targetListId = defaultBacklog.id;
}
```

**Step 2: Validate Target List**
```typescript
const targetList = await this.repository.findListByIdAndUser(targetListId, userId);

if (!targetList) {
  throw new NotFoundException('Target list not found');
}

if (targetList.isDone) {
  throw new BadRequestException('Cannot add tasks to Done list');
}

const currentTaskCount = await this.repository.countTasksInList(targetListId);

if (currentTaskCount + dto.tasks.length > 100) {
  throw new BadRequestException(
    `List has ${currentTaskCount} tasks. Cannot add ${dto.tasks.length} more (limit: 100)`
  );
}
```

**Step 3: Calculate Order Indexes**
```typescript
const maxOrderIndex = await this.repository.getMaxOrderIndex(targetListId) || 0;

// New tasks inserted at top: orderIndex = max + 1, max + 2, ...
// This ensures they appear above existing tasks
const tasks = dto.tasks.map((taskInput, index) => ({
  title: taskInput.title.trim(),
  description: taskInput.description?.trim() || null,
  orderIndex: maxOrderIndex + index + 1,
  listId: targetListId,
  userId,
}));
```

**Step 4: Bulk Create in Transaction**
```typescript
const createdTasks = await this.prisma.$transaction(
  tasks.map((task) => this.prisma.task.create({ data: task }))
);
```

**Alternative Approach (createMany):**
```typescript
// More efficient but doesn't return created records directly
await this.prisma.task.createMany({ data: tasks });

// Then fetch created tasks
const createdTasks = await this.prisma.task.findMany({
  where: {
    userId,
    listId: targetListId,
    createdAt: { gte: startTime }
  },
  orderBy: { orderIndex: 'desc' },
  take: dto.tasks.length
});
```

## 6. Security Considerations

### Authentication & Authorization
- ✅ Protected by `@UseGuards(JwtAuthGuard)`
- ✅ User ID from JWT token (`@CurrentUser()`)
- ✅ All repository queries scoped by `userId`

### Input Validation
- ✅ Array size: 1-10 tasks (enforced by `@ArrayMinSize`, `@ArrayMaxSize`)
- ✅ Title length: 1-500 characters (enforced by `@MinLength`, `@MaxLength`)
- ✅ Description length: max 5000 characters
- ✅ Empty titles rejected
- ✅ UUID validation for `listId`

### Business Logic Security
- ✅ Verify list ownership before insertion
- ✅ Prevent adding to Done list
- ✅ Enforce 100 task per list limit
- ✅ Atomic transaction: all tasks created or none

### Potential Threats

**1. Mass Assignment Attack**
- ✅ Mitigated: DTO uses explicit class-validator decorators
- ✅ Only `title`, `description`, `listId` accepted from client
- ✅ `userId`, `orderIndex`, `id` set by server

**2. SQL Injection**
- ✅ Mitigated: Prisma ORM uses parameterized queries

**3. Authorization Bypass (IDOR)**
- ✅ Mitigated: `findListByIdAndUser` filters by `userId`
- ✅ Repository methods always include `userId` in WHERE clause

**4. Resource Exhaustion (DoS)**
- ✅ Mitigated: Maximum 10 tasks per request
- ✅ Rate limiting should be configured at API gateway level (NestJS throttler)
- ✅ List limit of 100 tasks prevents unbounded growth

**5. Race Conditions**
- ⚠️ Potential Issue: Concurrent bulk-add requests could exceed list limit
- ✅ Mitigation: Use database transaction with SELECT FOR UPDATE (optional)
- 📝 For MVP: Accept small race condition window; post-MVP use row-level locking

## 7. Error Handling

### Validation Errors (400 Bad Request)

```typescript
// No tasks provided
{
  "statusCode": 400,
  "message": ["At least one task must be provided"],
  "error": "Bad Request"
}

// Too many tasks
{
  "statusCode": 400,
  "message": ["Maximum 10 tasks allowed per bulk add request"],
  "error": "Bad Request"
}

// Empty title
{
  "statusCode": 400,
  "message": ["tasks.0.title must be longer than or equal to 1 characters"],
  "error": "Bad Request"
}

// Title too long
{
  "statusCode": 400,
  "message": ["Task title must not exceed 500 characters"],
  "error": "Bad Request"
}
```

### Business Logic Errors (400 Bad Request)

```typescript
// Cannot add to Done list
{
  "statusCode": 400,
  "message": "Cannot add tasks to Done list",
  "error": "Bad Request"
}

// List full
{
  "statusCode": 400,
  "message": "List has 95 tasks. Cannot add 10 more (limit: 100)",
  "error": "Bad Request"
}
```

### Not Found Errors (404)

```typescript
// List not found
{
  "statusCode": 404,
  "message": "Target list not found",
  "error": "Not Found"
}

// No default backlog (edge case)
{
  "statusCode": 404,
  "message": "No default backlog found",
  "error": "Not Found"
}
```

### Authorization Errors (403 Forbidden)

```typescript
// List belongs to different user
{
  "statusCode": 403,
  "message": "List not found or access denied",
  "error": "Forbidden"
}
```

### Server Errors (500)

```typescript
// Transaction failure
{
  "statusCode": 500,
  "message": "Failed to create tasks",
  "error": "Internal Server Error"
}
```

## 8. Performance Considerations

### Database Operations
- **Query Count:** 3-4 queries per request
  1. Find/verify target list (1 SELECT)
  2. Count existing tasks in list (1 SELECT COUNT)
  3. Get max orderIndex (1 SELECT MAX)
  4. Bulk insert tasks (1 INSERT for createMany, or N INSERTs in transaction)

- **Optimization:** Use `createMany` instead of individual `create` calls
  - `createMany` is a single SQL INSERT statement
  - More efficient for bulk operations

### Index Usage
- Existing indexes support the queries:
  - `[userId, listId, orderIndex]` for finding tasks and max orderIndex
  - `[userId, completedAt]` not used in this flow

### Transaction Performance
- **Trade-off:** Atomicity vs. performance
  - `createMany` + separate SELECT: Faster, 2 queries
  - Individual `create` in `$transaction`: Slower, N+2 queries but returns IDs immediately

- **Recommendation:** Use `createMany` for better performance (max 10 tasks)

### Response Payload Size
- Maximum response size: ~10 tasks × ~500 bytes ≈ 5KB
- Well within acceptable limits for JSON responses

### Target Performance (PRD Requirement)
- **Goal:** 95th percentile <100ms for list interactions
- **Bulk-add:** May take 100-200ms for 10 tasks (still acceptable)
- **Monitoring:** Log execution time for analysis

## 9. Implementation Steps

### Step 1: Extend ListsRepository (Default Backlog)
**File:** `apps/backend/src/lists/infra/lists.repository.ts`

Add method to find user's default backlog:
```typescript
async findDefaultBacklog(userId: string): Promise<List | null> {
  return this.prisma.list.findFirst({
    where: {
      userId,
      isBacklog: true,
      isDone: false,
    },
    orderBy: { orderIndex: 'asc' }, // First backlog
  });
}
```

### Step 2: Extend TasksRepository
**File:** `apps/backend/src/tasks/infra/tasks.repository.ts`

Add methods for bulk operations:
```typescript
async findListByIdAndUser(listId: string, userId: string): Promise<List | null> {
  return this.prisma.list.findFirst({
    where: { id: listId, userId },
  });
}

async countTasksInList(listId: string): Promise<number> {
  return this.prisma.task.count({
    where: { listId, completedAt: null },
  });
}

async getMaxOrderIndex(listId: string): Promise<number> {
  const result = await this.prisma.task.aggregate({
    where: { listId },
    _max: { orderIndex: true },
  });
  return result._max.orderIndex || 0;
}

async bulkCreateTasks(
  tasks: Array<{
    title: string;
    description: string | null;
    orderIndex: number;
    listId: string;
    userId: string;
  }>
): Promise<Task[]> {
  // Use createMany for efficiency
  await this.prisma.task.createMany({ data: tasks });

  // Fetch created tasks (by createdAt and orderIndex)
  const now = new Date();
  return this.prisma.task.findMany({
    where: {
      listId: tasks[0].listId,
      userId: tasks[0].userId,
      createdAt: { gte: new Date(now.getTime() - 1000) }, // Within last second
    },
    orderBy: { orderIndex: 'desc' },
    take: tasks.length,
  });
}
```

### Step 3: Create BulkAddTasks Use Case
**File:** `apps/backend/src/tasks/use-cases/bulk-add-tasks.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BulkAddTasksDto } from '../dto/bulk-add-tasks.dto';
import { BulkAddTasksResponseDto, TaskDto } from '@gsd/types';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';
import type { Task } from '@prisma/client';

@Injectable()
export class BulkAddTasks {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(BulkAddTasks.name);
  }

  async execute(userId: string, dto: BulkAddTasksDto): Promise<BulkAddTasksResponseDto> {
    this.logger.log(`Bulk adding ${dto.tasks.length} tasks for user ${userId}`);

    try {
      // Step 1: Determine target list
      let targetListId: string;

      if (dto.listId) {
        targetListId = dto.listId;
      } else {
        const defaultBacklog = await this.listsRepository.findDefaultBacklog(userId);
        if (!defaultBacklog) {
          throw new NotFoundException('No default backlog found');
        }
        targetListId = defaultBacklog.id;
      }

      // Step 2: Validate target list
      const targetList = await this.tasksRepository.findListByIdAndUser(targetListId, userId);

      if (!targetList) {
        throw new NotFoundException('Target list not found');
      }

      if (targetList.isDone) {
        throw new BadRequestException('Cannot add tasks to Done list');
      }

      // Step 3: Check list capacity
      const currentTaskCount = await this.tasksRepository.countTasksInList(targetListId);
      const newTaskCount = dto.tasks.length;

      if (currentTaskCount + newTaskCount > 100) {
        throw new BadRequestException(
          `List has ${currentTaskCount} tasks. Cannot add ${newTaskCount} more (limit: 100)`,
        );
      }

      // Step 4: Calculate order indexes
      const maxOrderIndex = await this.tasksRepository.getMaxOrderIndex(targetListId);

      const tasksToCreate = dto.tasks.map((taskInput, index) => ({
        title: taskInput.title.trim(),
        description: taskInput.description?.trim() || null,
        orderIndex: maxOrderIndex + index + 1,
        listId: targetListId,
        userId,
      }));

      // Step 5: Bulk create tasks
      const createdTasks = await this.tasksRepository.bulkCreateTasks(tasksToCreate);

      this.logger.log(`Successfully created ${createdTasks.length} tasks in list ${targetListId}`);

      // Step 6: Build response
      return {
        tasks: createdTasks.map((task) => this.toDto(task, targetList.color || '#000000')),
        created: createdTasks.length,
        failed: 0,
        message: `Successfully created ${createdTasks.length} tasks`,
      };
    } catch (error) {
      this.logger.error(`Failed to bulk add tasks for user ${userId}`, error.stack);
      throw error;
    }
  }

  private toDto(task: Task, color: string): TaskDto {
    return {
      id: task.id,
      userId: task.userId,
      listId: task.listId,
      originBacklogId: task.listId, // TODO: Track actual origin backlog
      title: task.title,
      description: task.description,
      orderIndex: task.orderIndex,
      color,
      isCompleted: !!task.completedAt,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    };
  }
}
```

### Step 4: Create Unit Tests
**File:** `apps/backend/src/tasks/use-cases/bulk-add-tasks.spec.ts`

Test cases:
- ✅ Successfully creates tasks in provided list
- ✅ Successfully creates tasks in default backlog when listId omitted
- ✅ Throws NotFoundException when listId doesn't exist
- ✅ Throws NotFoundException when user has no default backlog
- ✅ Throws BadRequestException when trying to add to Done list
- ✅ Throws BadRequestException when list capacity would be exceeded
- ✅ Inserts tasks at top of list (orderIndex > existing max)
- ✅ Trims whitespace from title and description

### Step 5: Add Controller Endpoint
**File:** `apps/backend/src/tasks/adapters/tasks.controller.ts`

```typescript
import { BulkAddTasksDto } from '../dto/bulk-add-tasks.dto';
import { BulkAddTasks } from '../use-cases/bulk-add-tasks';

@Controller('v1/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    // ... existing use cases
    private readonly bulkAddTasksUseCase: BulkAddTasks,
  ) {}

  // ... existing endpoints

  @Post('bulk-add')
  @HttpCode(HttpStatus.CREATED)
  async bulkAddTasks(
    @CurrentUser() user: JwtUser,
    @Body() dto: BulkAddTasksDto,
  ): Promise<BulkAddTasksResponseDto> {
    return this.bulkAddTasksUseCase.execute(user.id, dto);
  }
}
```

### Step 6: Update TasksModule
**File:** `apps/backend/src/tasks/tasks.module.ts`

```typescript
import { BulkAddTasks } from './use-cases/bulk-add-tasks';
import { ListsModule } from '../lists/lists.module';

@Module({
  imports: [ListsModule], // Already imported
  controllers: [TasksController],
  providers: [
    // ... existing use cases
    BulkAddTasks,
    TasksRepository,
    // ... rest
  ],
  exports: [
    // ... existing exports
    BulkAddTasks,
  ],
})
export class TasksModule {}
```

### Step 7: Integration Tests
**File:** `apps/backend/test/tasks-bulk-add.e2e-spec.ts`

E2E test scenarios:
- ✅ POST /v1/tasks/bulk-add returns 201 with created tasks
- ✅ Uses default backlog when listId omitted
- ✅ Returns 401 without JWT
- ✅ Returns 403 when list belongs to different user
- ✅ Returns 400 when exceeding array size limits
- ✅ Returns 400 when list is full
- ✅ Filters out blank lines (if client sends empty titles)

### Step 8: Swagger Documentation
Add to controller:
```typescript
@ApiOperation({ summary: 'Bulk add tasks to a list' })
@ApiResponse({ status: 201, description: 'Tasks created successfully' })
@ApiResponse({ status: 400, description: 'Invalid input or list full' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 404, description: 'List not found' })
```

### Step 9: Update Project Tracker
- Mark "Dump Mode" and "Bulk-Add Tasks" as completed in `.ai/project-tracker.md`

## 10. Testing Strategy

### Unit Tests (BulkAddTasks Use Case)

**Happy Path:**
- ✅ Creates multiple tasks with provided listId
- ✅ Creates multiple tasks in default backlog when listId omitted
- ✅ Assigns correct orderIndex values (sequential, at top)
- ✅ Trims whitespace from title and description

**Error Paths:**
- ✅ Throws NotFoundException when listId doesn't exist
- ✅ Throws NotFoundException when no default backlog
- ✅ Throws BadRequestException when target is Done list
- ✅ Throws BadRequestException when list capacity exceeded (current + new > 100)

**Edge Cases:**
- ✅ Creates exactly 10 tasks (max allowed)
- ✅ Creates 1 task (min allowed)
- ✅ Handles empty description as null

### Integration Tests (E2E)

**HTTP Success:**
- ✅ POST /v1/tasks/bulk-add returns 201 with tasks array
- ✅ Response includes `created`, `failed`, `message` fields
- ✅ Tasks appear in target list via GET /v1/tasks?listId=X
- ✅ Tasks have sequential orderIndex values

**HTTP Errors:**
- ✅ Returns 400 for empty array
- ✅ Returns 400 for >10 tasks
- ✅ Returns 400 for invalid title length
- ✅ Returns 400 when list is Done
- ✅ Returns 401 without JWT token
- ✅ Returns 403 when list belongs to different user
- ✅ Returns 404 when listId doesn't exist

**Concurrency:**
- ⚠️ Test concurrent bulk-add requests (race condition on list limit)
  - Expected: Small window for race condition in MVP
  - Post-MVP: Add database-level locking if needed

## 11. Open Questions & Decisions

### 1. originBacklogId Field
**Question:** How should `originBacklogId` be tracked for tasks?

**Options:**
- A) Add `originBacklogId` column to Task model (persist it)
- B) Compute it at runtime (tasks created in backlog have `listId === originBacklogId`)
- C) Derive from list hierarchy (track which backlog a task came from as it moves)

**MVP Decision:** Use option B for now - set `originBacklogId = listId` at creation time. This works for dump mode where tasks are always created in a backlog.

**Post-MVP:** If tasks can be created in intermediate lists, implement proper origin tracking.

### 2. Blank Line Handling
**Question:** Should blank lines be filtered on backend or frontend?

**Current:** DTO validates `@MinLength(1)` so blank titles are rejected.

**Alternative:** Accept blank lines and filter them server-side before insertion.

**MVP Decision:** Keep DTO validation strict. Frontend should filter blank lines before sending request.

### 3. Duplicate Detection
**Question:** Should duplicate titles be prevented?

**PRD:** "Duplicates are allowed"

**MVP Decision:** Allow duplicates. Users may legitimately want multiple tasks with same title.

### 4. Transaction Strategy
**Question:** Use `createMany` (fast, separate SELECT) or `$transaction` (slower, atomic)?

**MVP Decision:** Use `createMany` + separate SELECT for better performance. The edge case of failed SELECT after successful INSERT is acceptable for MVP.

**Post-MVP:** If atomicity becomes critical, switch to `$transaction` with explicit creates.

### 5. Color Assignment
**Question:** How are task colors determined for bulk-added tasks?

**Current Implementation:** Uses list color (passed to `toDto`).

**Issue:** If tasks are added to intermediate list, what's their origin backlog color?

**MVP Decision:** Use target list color. Proper origin backlog tracking is deferred to later.

## 12. Related User Stories & Features

### User Stories
- **US-014**: Dump mode quick add (this feature)
- **US-005**: Create task in a list (individual creation)
- **US-019**: Limits enforcement (100 tasks per list)

### Related Features
- **CreateTask**: Individual task creation use case
- **Default Backlog Selection**: Logic for finding user's primary backlog
- **List Capacity Check**: Enforced in both CreateTask and BulkAddTasks

### Dependencies
- **ListsModule**: Needed to query default backlog
- **TasksRepository**: Extended with bulk operations
- **AuthModule**: JWT authentication

## 13. Performance Benchmarks

### Target Metrics (PRD Requirement)
- **Goal:** 95th percentile <100ms for list interactions
- **Acceptable for Bulk-Add:** 100-200ms (10× individual creates would be 1000ms)

### Estimated Query Times
- Find default backlog: ~5ms
- Verify list ownership: ~5ms
- Count tasks in list: ~10ms (with index)
- Get max orderIndex: ~10ms (with index)
- Bulk insert 10 tasks: ~50ms (createMany)
- Total: ~80ms (well within target)

### Monitoring
- Log execution time in use case
- Track 95th percentile in production metrics
- Alert if bulk-add exceeds 200ms

## 14. Rollout Plan

### Phase 1: Implementation (This Plan)
- Implement BulkAddTasks use case
- Add controller endpoint
- Write unit and integration tests

### Phase 2: Frontend Integration
- Create dump mode UI (multi-line textarea)
- Parse lines, trim whitespace, filter blanks
- Call POST /v1/tasks/bulk-add
- Show success/error feedback

### Phase 3: Monitoring & Iteration
- Monitor performance metrics
- Collect user feedback on dump mode UX
- Consider enhancements:
  - Parse special formats (Markdown checkboxes, etc.)
  - Smart duplicate detection
  - Batch size optimization
