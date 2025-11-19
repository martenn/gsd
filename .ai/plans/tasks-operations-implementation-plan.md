# Task Operations Implementation Plan: Move, Reorder, Complete

## 1. Feature Overview

This plan covers three critical task operations required for MVP:

1. **Move Task** (POST /v1/tasks/:id/move) - Move a task from one list to another
2. **Reorder Task** (POST /v1/tasks/:id/reorder) - Change task position within the same list
3. **Complete Task** (POST /v1/tasks/:id/complete) - Mark task as complete and move to Done list

These operations are part of the core task flow (Phase 2 in project tracker) and are HIGH PRIORITY features. They enable users to manage task lifecycle from creation through planning to completion.

**PRD References:**

- US-008: Move task between lists
- US-009: Reorder tasks within a list
- US-010: Complete task in work mode
- US-011: Complete task in plan mode

**Business Context:**

- Tasks flow left-to-right: backlogs → intermediate lists → Done
- Active work list is rightmost non-Done list
- Completing tasks is the primary user action in work mode
- Moving/reordering tasks is core planning activity

## 2. Inputs

### Move Task (POST /v1/tasks/:id/move)

**Path Parameters:**

- `id` (required, string): Task ID to move

**Request Body (MoveTaskDto):**

```typescript
{
  targetListId: string; // Required: Destination list ID
}
```

**Authentication:**

- userId from authenticated session (currently mock-user-id)

### Reorder Task (POST /v1/tasks/:id/reorder)

**Path Parameters:**

- `id` (required, string): Task ID to reorder

**Request Body (ReorderTaskDto):**

```typescript
{
  newOrderIndex?: number  // Option 1: Explicit position
  afterTaskId?: string    // Option 2: Position after specific task
}
```

Note: Exactly one of `newOrderIndex` or `afterTaskId` must be provided.

**Authentication:**

- userId from authenticated session

### Complete Task (POST /v1/tasks/:id/complete)

**Path Parameters:**

- `id` (required, string): Task ID to complete

**Request Body:**

- None (operation is idempotent)

**Authentication:**

- userId from authenticated session

## 3. Used Types

### DTOs

**MoveTaskDto** (apps/backend/src/tasks/dto/move-task.dto.ts):

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  @IsNotEmpty()
  targetListId: string;
}
```

**ReorderTaskDto** (apps/backend/src/tasks/dto/reorder-task.dto.ts):

```typescript
import { IsNumber, IsString, IsOptional, ValidateIf } from 'class-validator';

export class ReorderTaskDto {
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => !o.afterTaskId)
  newOrderIndex?: number;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.newOrderIndex === undefined)
  afterTaskId?: string;
}
```

**TaskDto** (response, should exist in @gsd/types or apps/backend):

```typescript
export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  listId: string;
  orderIndex: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  color: string; // Inherited from origin backlog
}
```

### Models

**Prisma Task Model** (existing in schema.prisma):

```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  listId      String
  userId      String
  orderIndex  Int
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  list        List      @relation(fields: [listId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([listId])
  @@index([userId])
  @@index([completedAt])
  @@index([orderIndex])
}
```

**Prisma List Model** (existing in schema.prisma):

```prisma
model List {
  id         String   @id @default(cuid())
  name       String
  userId     String
  orderIndex Int
  isBacklog  Boolean  @default(false)
  isDone     Boolean  @default(false)
  color      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tasks      Task[]
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

## 4. Outputs

### Move Task

**Success Response (200 OK):**

```typescript
{
  task: TaskDto; // Updated task with new listId and orderIndex
}
```

**Error Responses:**

- 400 Bad Request: Invalid targetListId, target is Done list, target list at capacity (100 tasks)
- 404 Not Found: Task not found, destination list not found
- 403 Forbidden: Task or destination list belongs to different user

### Reorder Task

**Success Response (204 No Content):**

- Empty body (operation updates order indices only)

**Error Responses:**

- 400 Bad Request: Neither or both of newOrderIndex/afterTaskId provided, invalid orderIndex value, afterTaskId not found in same list
- 404 Not Found: Task not found, afterTaskId not found
- 403 Forbidden: Task belongs to different user

### Complete Task

**Success Response (204 No Content):**

- Empty body (operation is idempotent)

**Error Responses:**

- 404 Not Found: Task not found, Done list not found for user
- 403 Forbidden: Task belongs to different user
- 500 Internal Server Error: Done list missing (data integrity issue)

## 5. Data Flow

### Move Task Flow

1. **Controller** receives POST /v1/tasks/:id/move with MoveTaskDto
2. **Validation** via class-validator decorators on DTO
3. **Use Case (MoveTask)** receives taskId, userId, dto.targetListId
4. **Repository Operations:**
   - Fetch task by ID and userId (ownership check)
   - Fetch target list by ID and userId (ownership + existence check)
   - Validate target list is not Done (isDone !== true)
   - Count tasks in target list (validate < 100)
   - Calculate new orderIndex for task (insert at top)
   - Update task: set listId = targetListId, orderIndex = calculated value
5. **Response** with updated TaskDto
6. **Logging** at use case level (start, success, error)

### Reorder Task Flow

1. **Controller** receives POST /v1/tasks/:id/reorder with ReorderTaskDto
2. **Validation** via class-validator (exactly one of newOrderIndex/afterTaskId)
3. **Use Case (ReorderTask)** receives taskId, userId, dto
4. **Repository Operations:**
   - Fetch task by ID and userId (ownership check)
   - **If newOrderIndex provided:**
     - Update task.orderIndex = newOrderIndex
     - Optionally shift other tasks (implementation detail)
   - **If afterTaskId provided:**
     - Fetch afterTask by ID and validate same listId
     - Calculate newOrderIndex = afterTask.orderIndex + 1 (or fractional)
     - Update task.orderIndex = calculated value
5. **Response** 204 No Content
6. **Logging** at use case level

### Complete Task Flow

1. **Controller** receives POST /v1/tasks/:id/complete
2. **No request body validation** (idempotent operation)
3. **Use Case (CompleteTask)** receives taskId, userId
4. **Repository Operations:**
   - Fetch task by ID and userId (ownership check)
   - Fetch Done list for userId (isDone = true)
   - If Done list not found, throw 500 error (data integrity)
   - Calculate orderIndex for Done list (insert at top or append)
   - Update task: set completedAt = new Date(), listId = doneList.id, orderIndex = calculated value
5. **Response** 204 No Content
6. **Logging** at use case level

## 6. Security Considerations

### Authentication

- All endpoints require authenticated userId (currently mock, future: JWT from session)
- Controllers extract userId from auth context (not request body)

### Authorization

- **Ownership Validation:** All operations must verify task.userId === authenticated userId
- **List Ownership Validation:** Move operation must verify targetList.userId === authenticated userId
- Prevent cross-user task/list access

### Input Validation

- **Move Task:**
  - Validate targetListId is valid UUID/CUID format
  - Prevent SQL injection via Prisma parameterized queries
  - Validate target list exists and belongs to user
  - Validate target list is not Done (isDone !== true)

- **Reorder Task:**
  - Validate exactly one of newOrderIndex or afterTaskId is provided
  - Validate newOrderIndex is non-negative integer (if provided)
  - Validate afterTaskId exists and belongs to same list (if provided)

- **Complete Task:**
  - No user input beyond taskId (path parameter)
  - Validate taskId format

### Data Integrity

- **Move Task:** Validate target list capacity (< 100 tasks) before allowing move
- **Complete Task:** Ensure Done list exists for user (created during onboarding)
- Use Prisma transactions for operations that update multiple records

### Potential Threats

1. **Unauthorized Access:** User tries to move/complete other users' tasks
   - Mitigation: Always include userId in WHERE clauses

2. **Resource Exhaustion:** User tries to move task to full list (100 tasks)
   - Mitigation: Count tasks in target list before move

3. **Invalid State:** User tries to move to Done list via move endpoint
   - Mitigation: Validate !isDone on target list

4. **Race Conditions:** Multiple concurrent reorder operations
   - Mitigation: Use database transactions, consider optimistic locking (future)

## 7. Performance Considerations

### Database Queries

- **Move Task:**
  - 1 query: Fetch task with userId filter
  - 1 query: Fetch target list with userId filter
  - 1 query: Count tasks in target list
  - 1 query: Get max orderIndex in target list (for insert at top)
  - 1 query: Update task
  - **Total: 5 queries** (can optimize with transaction)

- **Reorder Task:**
  - 1 query: Fetch task with userId filter
  - 0-1 query: Fetch afterTask (if using afterTaskId strategy)
  - 1 query: Update task orderIndex
  - **Total: 2-3 queries**

- **Complete Task:**
  - 1 query: Fetch task with userId filter
  - 1 query: Fetch Done list for user
  - 1 query: Get max orderIndex in Done list (for insert at top)
  - 1 query: Update task (completedAt, listId, orderIndex)
  - **Total: 4 queries**

### Optimization Strategies

1. **Indexing:** Ensure indices exist on:
   - Task(userId, listId) - composite index
   - Task(orderIndex)
   - List(userId, isDone) - composite index

2. **Batch Operations:** Reorder may require shifting multiple tasks
   - Use Prisma updateMany for bulk updates (if needed)
   - Consider fractional indexing to avoid cascading updates (future optimization)

3. **Caching:** Not applicable for MVP (operations modify state)

4. **Transactions:** Use Prisma $transaction for multi-step operations
   - Move task (if implementing capacity validation with update)
   - Complete task (update task + potentially update orderIndex of others)

### Expected Performance

- Target: <100ms for individual task operations (per PRD)
- Reorder should be instant (single update query)
- Move and Complete may be slower due to orderIndex calculation

### Bottlenecks

1. **Order Index Calculation:** Getting max orderIndex + 1 requires full table scan
   - Mitigation: Index on orderIndex, periodic reindex job (planned)

2. **Capacity Validation:** Counting tasks in target list for every move
   - Mitigation: Consider caching list task counts (future)

## 8. Implementation Steps

### Phase 1: Move Task (POST /v1/tasks/:id/move)

**Step 1: Create DTO and Repository Methods**

- [ ] Create `apps/backend/src/tasks/dto/move-task.dto.ts`
  - Implement MoveTaskDto with @IsString() @IsNotEmpty() targetListId
- [ ] Add methods to `TasksRepository`:
  - `findById(taskId: string, userId: string): Promise<Task | null>`
  - `countTasksInList(listId: string): Promise<number>`
  - `getMaxOrderIndexInList(listId: string): Promise<number>`
  - `moveTaskToList(taskId: string, targetListId: string, newOrderIndex: number): Promise<Task>`
- [ ] Add method to `ListsRepository`:
  - `findById(listId: string, userId: string): Promise<List | null>` (may already exist)

**Step 2: Create MoveTask Use Case**

- [ ] Create `apps/backend/src/tasks/use-cases/move-task.ts`
  - Inject TasksRepository, ListsRepository, AppLogger
  - Implement `execute(userId: string, taskId: string, dto: MoveTaskDto): Promise<TaskDto>`
  - Business logic:
    1. Fetch task with userId ownership check (throw NotFoundException if not found)
    2. Fetch target list with userId ownership check (throw NotFoundException if not found)
    3. Validate target list is not Done (throw BadRequestException if isDone)
    4. Count tasks in target list (throw BadRequestException if >= 100)
    5. Get max orderIndex in target list
    6. Calculate newOrderIndex = max + 1 (or 0 if empty list)
    7. Call repository.moveTaskToList(taskId, targetListId, newOrderIndex)
    8. Map result to TaskDto and return
  - Wrap in try-catch with logger.error on failure
  - Add logger.log at start and success
- [ ] Create `apps/backend/src/tasks/use-cases/move-task.spec.ts`
  - Test: successful move to valid list
  - Test: 404 when task not found
  - Test: 404 when target list not found
  - Test: 403 when task belongs to different user
  - Test: 403 when target list belongs to different user
  - Test: 400 when target list is Done
  - Test: 400 when target list at capacity (100 tasks)
  - Mock TasksRepository, ListsRepository, AppLogger

**Step 3: Add Controller Endpoint**

- [ ] Update `apps/backend/src/tasks/adapters/tasks.controller.ts`
  - Inject MoveTask use case as `moveTaskUseCase: MoveTask`
  - Add endpoint:
    ```typescript
    @Post(':id/move')
    @HttpCode(200)
    async moveTask(
      @Param('id') taskId: string,
      @Body() dto: MoveTaskDto,
    ): Promise<{ task: TaskDto }> {
      const userId = 'mock-user-id'; // TODO: Get from auth
      const task = await this.moveTaskUseCase.execute(userId, taskId, dto);
      return { task };
    }
    ```
- [ ] Update `TasksModule` providers to include MoveTask use case
- [ ] Test endpoint with Postman/curl or E2E test

---

### Phase 2: Complete Task (POST /v1/tasks/:id/complete)

**Step 4: Create CompleteTask Use Case**

- [ ] Add methods to `TasksRepository`:
  - `completeTask(taskId: string, doneListId: string, completedAt: Date, orderIndex: number): Promise<Task>`
- [ ] Add method to `ListsRepository`:
  - `findDoneList(userId: string): Promise<List | null>`
- [ ] Create `apps/backend/src/tasks/use-cases/complete-task.ts`
  - Inject TasksRepository, ListsRepository, AppLogger
  - Implement `execute(userId: string, taskId: string): Promise<void>`
  - Business logic:
    1. Fetch task with userId ownership check (throw NotFoundException)
    2. Fetch Done list for userId (throw InternalServerErrorException if not found - data integrity)
    3. Get max orderIndex in Done list
    4. Calculate newOrderIndex = max + 1 (or 0 if empty)
    5. Set completedAt = new Date() (UTC)
    6. Call repository.completeTask(taskId, doneListId, completedAt, newOrderIndex)
    7. Return void (204 response)
  - Wrap in try-catch with logging
- [ ] Create `apps/backend/src/tasks/use-cases/complete-task.spec.ts`
  - Test: successful completion moves task to Done
  - Test: sets completedAt timestamp
  - Test: updates listId to Done list
  - Test: 404 when task not found
  - Test: 403 when task belongs to different user
  - Test: 500 when Done list missing (data integrity error)
  - Mock repositories and logger

**Step 5: Add Controller Endpoint**

- [ ] Update `apps/backend/src/tasks/adapters/tasks.controller.ts`
  - Inject CompleteTask use case as `completeTaskUseCase: CompleteTask`
  - Add endpoint:
    ```typescript
    @Post(':id/complete')
    @HttpCode(204)
    async completeTask(@Param('id') taskId: string): Promise<void> {
      const userId = 'mock-user-id'; // TODO: Get from auth
      await this.completeTaskUseCase.execute(userId, taskId);
    }
    ```
- [ ] Update `TasksModule` providers to include CompleteTask use case
- [ ] Test endpoint with Postman/curl or E2E test

---

### Phase 3: Reorder Task (POST /v1/tasks/:id/reorder)

**Step 6: Create DTO and Repository Methods**

- [ ] Create `apps/backend/src/tasks/dto/reorder-task.dto.ts`
  - Implement ReorderTaskDto with custom validation:
    - Either newOrderIndex OR afterTaskId must be provided (not both, not neither)
    - Use @ValidateIf decorator for conditional validation
- [ ] Add methods to `TasksRepository`:
  - `updateOrderIndex(taskId: string, newOrderIndex: number): Promise<Task>`
  - `findById(taskId: string, userId: string): Promise<Task | null>` (may already exist)

**Step 7: Create ReorderTask Use Case**

- [ ] Create `apps/backend/src/tasks/use-cases/reorder-task.ts`
  - Inject TasksRepository, AppLogger
  - Implement `execute(userId: string, taskId: string, dto: ReorderTaskDto): Promise<void>`
  - Business logic:
    1. Fetch task with userId ownership check (throw NotFoundException)
    2. **If dto.newOrderIndex provided:**
       - Validate newOrderIndex >= 0
       - Call repository.updateOrderIndex(taskId, dto.newOrderIndex)
    3. **If dto.afterTaskId provided:**
       - Fetch afterTask by ID
       - Validate afterTask exists (throw NotFoundException)
       - Validate afterTask.listId === task.listId (throw BadRequestException)
       - Calculate newOrderIndex = afterTask.orderIndex + 1
       - Call repository.updateOrderIndex(taskId, newOrderIndex)
    4. Return void (204 response)
  - Wrap in try-catch with logging
- [ ] Create `apps/backend/src/tasks/use-cases/reorder-task.spec.ts`
  - Test: successful reorder with newOrderIndex
  - Test: successful reorder with afterTaskId
  - Test: 404 when task not found
  - Test: 404 when afterTask not found
  - Test: 403 when task belongs to different user
  - Test: 400 when afterTask in different list
  - Test: 400 when neither newOrderIndex nor afterTaskId provided
  - Test: 400 when both newOrderIndex and afterTaskId provided
  - Mock repository and logger

**Step 8: Add Controller Endpoint**

- [ ] Update `apps/backend/src/tasks/adapters/tasks.controller.ts`
  - Inject ReorderTask use case as `reorderTaskUseCase: ReorderTask`
  - Add endpoint:
    ```typescript
    @Post(':id/reorder')
    @HttpCode(204)
    async reorderTask(
      @Param('id') taskId: string,
      @Body() dto: ReorderTaskDto,
    ): Promise<void> {
      const userId = 'mock-user-id'; // TODO: Get from auth
      await this.reorderTaskUseCase.execute(userId, taskId, dto);
    }
    ```
- [ ] Update `TasksModule` providers to include ReorderTask use case
- [ ] Test endpoint with Postman/curl or E2E test

---

### Phase 4: Integration & Testing

**Step 9: Update Module Configuration**

- [ ] Update `apps/backend/src/tasks/tasks.module.ts`
  - Add all three use cases to providers array:
    ```typescript
    providers: [
      TasksRepository,
      // ... existing use cases
      MoveTask,
      ReorderTask,
      CompleteTask,
    ];
    ```
  - Ensure TasksRepository and ListsRepository are available (import ListsModule if needed)

**Step 10: End-to-End Testing**

- [ ] Create E2E test file: `apps/backend/test/tasks-operations.e2e-spec.ts`
  - Test full flow: Create task → Move to different list → Reorder → Complete
  - Test edge cases: Move to full list, complete already completed task (idempotent)
  - Test error scenarios: 404s, 400s, 403s
  - Verify database state after each operation
- [ ] Run full test suite: `pnpm test`
- [ ] Run E2E tests: `pnpm test:e2e`

**Step 11: Documentation & Cleanup**

- [ ] Update API documentation (Swagger decorators):
  - Add @ApiOperation() descriptions for each endpoint
  - Add @ApiResponse() for success and error codes
  - Add @ApiParam() for path parameters
  - Add @ApiBody() for request DTOs
- [ ] Update `.ai/project-tracker.md`:
  - Mark MoveTask as ✅ Completed
  - Mark ReorderTask as ✅ Completed
  - Mark CompleteTask as ✅ Completed
  - Update Phase 2 progress bar
- [ ] Code review checklist:
  - All use cases have logging (start, success, error)
  - All use cases have comprehensive tests
  - Repository methods use Prisma safely (no SQL injection)
  - DTOs have proper validation decorators
  - Error messages are clear and actionable
  - No "Service" suffix in class names
  - File names match class names (kebab-case)

---

## 9. Open Questions & Future Considerations

**Order Index Strategy:**

- Current approach: Simple incrementing integers (max + 1)
- Future optimization: Fractional indexing to avoid cascading updates
- Periodic reindex job planned in MaintenanceModule (out of scope for this feature)

**Transaction Strategy:**

- Should Move/Complete operations use Prisma transactions?
- Current plan: Single update queries (simpler, faster)
- Future: Consider transactions if concurrency issues arise

**Idempotency:**

- Complete task is idempotent (can complete already completed task)
- Should we return different status codes for already-completed tasks?
- Current plan: Return 204 regardless (simpler UX)

**Capacity Validation:**

- Move task validates target list < 100 tasks
- Should we cache task counts to improve performance?
- Current plan: Count on every move (accurate, simpler)

**Done List Creation:**

- Complete task assumes Done list exists for user
- When is Done list created? During user onboarding?
- Should we auto-create Done list if missing? (No - throw 500 for data integrity)

**Authentication Integration:**

- All endpoints currently use mock-user-id
- Need to replace with authenticated userId from JWT session (Phase 1: Authentication)
- Guards should be added to protect all endpoints

---

## 10. Dependencies & Blockers

**Blockers:**

- None (can implement with mock userId)

**Dependencies:**

- TasksRepository (existing, needs new methods)
- ListsRepository (existing, needs findDoneList method)
- AppLogger (existing)
- Prisma schema (existing, Task and List models)

**Future Dependencies:**

- Authentication module (to replace mock userId)
- Done list creation during user onboarding (ensures Done list exists)

**Related Features:**

- Delete list (already implemented, uses destination list concept)
- Create task (already implemented, inserts at top using orderIndex)
- Bulk add tasks (planned, will use similar move/insert logic)

---

## 11. Success Criteria

**Functional Requirements:**

- ✅ User can move task from one list to another
- ✅ Moved task appears at top of destination list
- ✅ User cannot move task to Done list (must use complete)
- ✅ User cannot move task to full list (100 tasks)
- ✅ User can reorder task within same list using newOrderIndex
- ✅ User can reorder task within same list using afterTaskId
- ✅ User can complete task from any list
- ✅ Completed task moves to Done list with completedAt timestamp
- ✅ All operations enforce userId ownership

**Non-Functional Requirements:**

- ✅ All endpoints respond in <100ms (at MVP scale)
- ✅ All use cases have comprehensive unit tests (>80% coverage)
- ✅ All endpoints have E2E tests covering success and error paths
- ✅ All operations are logged (start, success, error)
- ✅ Code follows clean architecture (adapters → use cases → repositories)
- ✅ DTOs follow validation best practices
- ✅ Error messages are clear and actionable

**Validation Criteria:**

- Run `pnpm test` - all tests pass
- Run `pnpm build` - no TypeScript errors
- Run `pnpm typecheck` - no type errors
- Test endpoints via Postman/curl - all CRUD operations work
- Verify database state after operations (Prisma Studio)
- Code review passes (no "Service" suffix, proper logging, etc.)
