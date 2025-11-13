# Done Module Implementation Plan

## 1. Feature Overview

The Done module provides read-only access to completed tasks through a paginated API endpoint. When tasks are completed (via `POST /v1/tasks/:id/complete`), they are moved to the Done list with `completed_at` set to the current timestamp. This module allows users to review their completion history.

**Endpoint:** `GET /v1/done`

**Key behaviors:**
- Returns paginated list of completed tasks using limit+offset
- Ordered by completion date (newest first)
- Filtered by authenticated user
- Includes task origin information (list, backlog color)

## 2. Inputs

**Query Parameters:**
- `limit` (optional, number): Number of tasks to return (default: 50, min: 1, max: 100)
- `offset` (optional, number): Number of tasks to skip (default: 0, min: 0)

**Authentication:**
- JWT token in HttpOnly cookie (required)

## 3. Used Types

**Request DTO:**
```typescript
// apps/backend/src/done/dto/get-done-query.dto.ts
export class GetDoneQueryDto implements GetDoneQuery {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
```

**Shared Types (@gsd/types):**
```typescript
// Add to @gsd/types/api/done.ts
export interface GetDoneQuery {
  limit?: number;
  offset?: number;
}

export interface DoneTaskDto {
  id: string;
  title: string;
  description: string | null;
  completedAt: Date;
  listId: string;
  listName: string;
  color: string;
  originBacklogId: string;
}

export interface GetDoneResponseDto {
  tasks: DoneTaskDto[];
  total: number;
  limit: number;
  offset: number;
}
```

**Database Model:**
Uses existing Prisma `Task` model with `completed_at IS NOT NULL`

## 4. Data Flow

1. **Controller** receives GET request with optional `limit` and `offset` query params
2. **JWT Guard** validates authentication, extracts user ID
3. **Use Case** (`GetDoneTasks.execute(userId, query)`)
   - Applies defaults: limit=50, offset=0
   - Validates limits (max 100)
   - Calls repository for paginated completed tasks
   - Calls repository for total count
   - Transforms to DTOs with pagination metadata
4. **Repository** (`DoneRepository`)
   - `findCompletedTasks(userId, limit, offset)` - fetch paginated tasks with list/color info
   - `countCompletedTasks(userId)` - get total count for pagination
5. **Response** returns `GetDoneResponseDto` with tasks and metadata

## 5. Security Considerations

- **Authentication**: JwtAuthGuard required on endpoint
- **Authorization**: Filter by `userId` from JWT payload only (no cross-user access)
- **Input validation**: Validate `limit` (1-100) and `offset` (>=0)
- **Data exposure**: Only return user's own completed tasks
- **No mutations**: Read-only endpoint, no state changes

## 6. Error Handling

| Scenario | Status Code | Response |
|----------|-------------|----------|
| Success | 200 | `GetDoneResponseDto` |
| Not authenticated | 401 | Handled by JwtAuthGuard |
| Invalid limit/offset | 400 | Validation error from class-validator |
| Database error | 500 | Log error, return generic message |
| Offset beyond available data | 200 | Return empty tasks array with correct total |

**Logging strategy:**
- Log start of execution with userId, limit, offset
- Log successful completion with task count
- Log errors with full context before throwing

## 7. Performance Considerations

- **Indexing**: Ensure index on `(user_id, completed_at DESC)` for efficient queries
- **Pagination**: Use LIMIT/OFFSET for pagination (acceptable for MVP with 500 task limit)
- **Query optimization**: Single query with JOIN to get list and color data
- **Default limit**: 50 tasks per page (reasonable for network transfer)
- **Count query**: Separate count query (can be optimized with caching if needed post-MVP)

## 8. Implementation Steps

### Phase 1: Core Structure (Steps 1-3)
1. **Create shared types in @gsd/types**
   - Add `@gsd/types/api/done.ts` with `GetDoneQuery`, `DoneTaskDto`, `GetDoneResponseDto`
   - Export from `@gsd/types/index.ts`

2. **Create module structure**
   - Create `apps/backend/src/done/` directory
   - Create `done.module.ts` with DoneModule
   - Add DoneModule to `app.module.ts` imports

3. **Implement DoneRepository**
   - Create `apps/backend/src/done/infra/done.repository.ts`
   - Implement `findCompletedTasks(userId, limit, offset)` with Prisma query joining List and Task
   - Implement `countCompletedTasks(userId)` for pagination metadata
   - Add to DoneModule providers

### Phase 2: Business Logic (Steps 4-6)
4. **Implement GetDoneTasks use case**
   - Create `apps/backend/src/done/use-cases/get-done-tasks.ts`
   - Inject DoneRepository and AppLogger
   - Implement `execute(userId, query)` with pagination defaults (limit=50, offset=0)
   - Transform Prisma entities to DTOs
   - Add to DoneModule providers

5. **Create request DTO**
   - Create `apps/backend/src/done/dto/get-done-query.dto.ts`
   - Implement validation decorators for limit (1-100) and offset (>=0)
   - Use @Type() decorator for proper number transformation

6. **Implement controller**
   - Create `apps/backend/src/done/adapters/done.controller.ts`
   - Add JwtAuthGuard
   - Inject GetDoneTasks use case
   - Implement GET endpoint with @CurrentUser decorator
   - Add to DoneModule controllers

### Phase 3: Testing & Documentation (Steps 7-8)
7. **Write unit tests**
   - Create `apps/backend/src/done/use-cases/get-done-tasks.spec.ts`
   - Test pagination logic (first page, offset, limits)
   - Test empty results
   - Test error handling
   - Mock DoneRepository

8. **Update API documentation**
   - Add Swagger decorators to controller (@ApiTags, @ApiOperation, @ApiQuery, @ApiResponse)
   - Verify endpoint appears in Swagger UI
   - Test endpoint manually with authenticated request

---

**Notes:**
- Default limit: 50 tasks, max: 100
- Uses limit+offset pagination (consistent with GET /v1/tasks)
- Retention job implementation will be in separate MaintenanceModule
- Done list itself already exists in database (created during onboarding)
- Tasks are marked complete via existing `CompleteTask` use case
