# Feature Implementation Plan: Lists Management (Missing Features)

## 1. Feature Overview

This plan covers the missing CRUD operations for Lists Management that are required by the PRD but not yet implemented:

1. **Update/Rename List** - PATCH /v1/lists/:id
2. **Toggle Backlog Status** - POST /v1/lists/:id/toggle-backlog
3. **Reorder Lists** - POST /v1/lists/:id/reorder

The Lists module already has GET (GetLists), POST (CreateList), and DELETE (DeleteList) implemented. These three features complete the full set of list management operations required for Plan Mode.

### Business Context

- **Update List**: Users need to rename lists as their workflow evolves (US-002)
- **Toggle Backlog**: Users can mark/unmark non-Done lists as backlogs, with constraint that at least one backlog must always exist (US-001A, US-003A)
- **Reorder Lists**: Users define their workflow by ordering lists left-to-right, with the rightmost non-Done list becoming the active work list (US-004)

## 2. Current Implementation Status

**Already Implemented:**
- `GetLists` use case (GET /v1/lists)
- `CreateList` use case (POST /v1/lists)
- `DeleteList` use case (DELETE /v1/lists/:id?destListId=...)
- `ListsRepository` with basic Prisma operations
- `ListsController` with authentication/authorization guards

**Database Schema (List model):**
```prisma
model List {
  id         String   @id @default(uuid())
  name       String
  orderIndex Float    @map("order_index")
  isBacklog  Boolean  @default(false) @map("is_backlog")
  isDone     Boolean  @default(false) @map("is_done")
  color      String?
  userId     String   @map("user_id")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId, orderIndex])
  @@index([userId, isDone])
}
```

## 3. Missing Features to Implement

### Feature 1: Update List (Rename)

**Endpoint:** `PATCH /v1/lists/:id`

**Purpose:** Allow users to rename existing lists while maintaining all other properties.

**Inputs:**
- Path parameter: `id` (UUID of list to update)
- Request body: `{ name: string }` (new name)
- User ID from JWT token

**Output:**
- 200 OK: Updated `ListDto`
- 400 Bad Request: Invalid input (empty name, exceeds length)
- 401 Unauthorized: User not authenticated
- 403 Forbidden: List belongs to different user
- 404 Not Found: List doesn't exist

**Business Rules:**
- Name must be 1-100 characters
- Name is trimmed of whitespace
- Cannot rename the Done list (isDone = true)
- User can only update their own lists

**Types Required:**
```typescript
// @gsd/types/api/lists.ts (add to existing file)
export interface UpdateListRequest {
  name: string;
}

export interface UpdateListResponseDto {
  list: ListDto;
}

// apps/backend/src/lists/dto/update-list.dto.ts (new file)
export class UpdateListDto implements UpdateListRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;
}
```

### Feature 2: Toggle Backlog Status

**Endpoint:** `POST /v1/lists/:id/toggle-backlog`

**Purpose:** Mark or unmark a non-Done list as a backlog, enforcing the constraint that at least one backlog must always exist.

**Inputs:**
- Path parameter: `id` (UUID of list)
- User ID from JWT token

**Output:**
- 200 OK: Updated `ListDto` with toggled `isBacklog` value
- 400 Bad Request: Operation would violate "at least one backlog" constraint
- 401 Unauthorized: User not authenticated
- 403 Forbidden: List belongs to different user
- 404 Not Found: List doesn't exist

**Business Rules:**
- Cannot toggle the Done list (isDone = true) - return 400
- If toggling OFF would result in zero backlogs, return 400 with error message
- If toggling ON, list becomes a backlog (may need to reorder to leftmost position)
- At least one backlog must always exist

**Types Required:**
```typescript
// @gsd/types/api/lists.ts (add to existing)
export interface ToggleBacklogResponseDto {
  list: ListDto;
}

// No request body needed - toggle operation
```

**Algorithm:**
1. Verify list exists and belongs to user
2. Check if list.isDone === true → return 400
3. If isBacklog === true (currently a backlog):
   - Count total backlogs for user
   - If count === 1 → return 400 (cannot unmark last backlog)
   - Else → set isBacklog = false
4. If isBacklog === false (currently not a backlog):
   - Set isBacklog = true
5. Return updated list

### Feature 3: Reorder Lists

**Endpoint:** `POST /v1/lists/:id/reorder`

**Purpose:** Change the left-to-right position of a list by updating its orderIndex.

**Inputs:**
- Path parameter: `id` (UUID of list to reorder)
- Request body: One of:
  - `{ newOrderIndex: number }` - Explicit order index
  - `{ afterListId: string }` - Place after specified list
- User ID from JWT token

**Output:**
- 200 OK: Updated `ListDto` with new orderIndex
- 400 Bad Request: Invalid input or conflicting parameters
- 401 Unauthorized: User not authenticated
- 403 Forbidden: List belongs to different user
- 404 Not Found: List or afterListId doesn't exist

**Business Rules:**
- Cannot reorder the Done list
- Backlogs maintain leftmost grouping (backlogs ordered before all intermediate lists)
- Use fractional indexing for orderIndex to minimize updates
- Only one of `newOrderIndex` or `afterListId` should be provided

**Types Required:**
```typescript
// @gsd/types/api/lists.ts (add to existing)
export interface ReorderListRequest {
  newOrderIndex?: number;
  afterListId?: string;
}

export interface ReorderListResponseDto {
  list: ListDto;
}

// apps/backend/src/lists/dto/reorder-list.dto.ts (new file)
export class ReorderListDto implements ReorderListRequest {
  @IsNumber()
  @IsOptional()
  newOrderIndex?: number;

  @IsUUID('4')
  @IsOptional()
  afterListId?: string;

  @ValidateIf((o) => !o.newOrderIndex && !o.afterListId)
  @IsNotEmpty({ message: 'Either newOrderIndex or afterListId must be provided' })
  _atLeastOne?: never;
}
```

**Algorithm:**
1. Verify list exists and belongs to user
2. Check if list.isDone === true → return 400
3. If `afterListId` provided:
   - Fetch target list, verify it exists and belongs to user
   - Calculate new orderIndex = (targetList.orderIndex + nextList.orderIndex) / 2
4. Else if `newOrderIndex` provided:
   - Use provided value directly
5. Update list.orderIndex
6. Return updated list

**Note:** Reindexing strategy (when orderIndex values get too close) is marked as TBD in PRD. For MVP, use simple fractional indexing without automatic reindexing.

## 4. Data Flow

### Update List Flow
1. Client → PATCH /v1/lists/:id with { name }
2. Controller validates DTO, extracts user ID from JWT
3. Controller → UpdateList use case
4. Use case → ListsRepository.findOneByIdAndUser(id, userId)
5. If not found or isDone → throw error
6. Use case → ListsRepository.update(id, { name })
7. Use case → return ListDto
8. Controller → return 200 with ListDto

### Toggle Backlog Flow
1. Client → POST /v1/lists/:id/toggle-backlog
2. Controller extracts user ID from JWT
3. Controller → ToggleBacklog use case
4. Use case → ListsRepository.findOneByIdAndUser(id, userId)
5. If not found or isDone → throw error
6. If currently backlog:
   - Use case → ListsRepository.countBacklogs(userId)
   - If count === 1 → throw BadRequestException
7. Use case → ListsRepository.update(id, { isBacklog: !current })
8. Use case → return ListDto
9. Controller → return 200 with ListDto

### Reorder List Flow
1. Client → POST /v1/lists/:id/reorder with { afterListId } or { newOrderIndex }
2. Controller validates DTO, extracts user ID from JWT
3. Controller → ReorderList use case
4. Use case → ListsRepository.findOneByIdAndUser(id, userId)
5. If not found or isDone → throw error
6. If afterListId:
   - Use case → ListsRepository.findOneByIdAndUser(afterListId, userId)
   - Calculate new orderIndex using fractional indexing
7. Use case → ListsRepository.update(id, { orderIndex })
8. Use case → return ListDto
9. Controller → return 200 with ListDto

## 5. Security Considerations

### Authentication & Authorization
- All endpoints protected by `@UseGuards(JwtAuthGuard)`
- User ID extracted from JWT via `@CurrentUser()` decorator
- Repository queries scoped by userId to prevent cross-user access

### Input Validation
- **UpdateList**: Name trimmed, length validated (1-100 chars)
- **ToggleBacklog**: No input, but verify list ownership
- **ReorderList**: Validate UUID format for afterListId, numeric range for orderIndex

### Business Logic Security
- Prevent modification of Done list (isDone checks)
- Enforce "at least one backlog" constraint
- Verify ownership before any mutation

### Potential Threats
- **Mass Assignment**: DTOs use explicit class-validator decorators
- **SQL Injection**: Prisma ORM provides parameterized queries
- **Authorization Bypass**: All repository methods filter by userId
- **IDOR**: UUID path parameters validated, ownership verified

## 6. Error Handling

### Standard HTTP Status Codes
- **200 OK**: Successful update/toggle/reorder
- **400 Bad Request**:
  - Invalid input (validation failure)
  - Cannot rename Done list
  - Cannot toggle Done list
  - Cannot unmark last backlog
  - Cannot reorder Done list
  - Missing required parameters
- **401 Unauthorized**: No JWT or invalid JWT
- **403 Forbidden**: List belongs to different user
- **404 Not Found**: List not found (or afterListId not found)
- **500 Internal Server Error**: Unexpected database/server errors

### Error Response Format
```typescript
{
  "statusCode": 400,
  "message": "Cannot unmark the last backlog. At least one backlog must exist.",
  "error": "Bad Request"
}
```

### Specific Error Messages
- `"List name must be between 1 and 100 characters"`
- `"Cannot rename the Done list"`
- `"Cannot toggle backlog status of the Done list"`
- `"Cannot unmark the last backlog. At least one backlog must exist."`
- `"Cannot reorder the Done list"`
- `"List not found or access denied"`
- `"Either newOrderIndex or afterListId must be provided"`

## 7. Performance Considerations

### Database Queries
- **Update List**: Single SELECT + UPDATE (2 queries)
- **Toggle Backlog**: SELECT + optional COUNT + UPDATE (2-3 queries)
- **Reorder List**: SELECT (1-2) + UPDATE (2-3 queries total)

### Indexes
- Existing index `[userId, orderIndex]` supports efficient ordering queries
- Existing index `[userId, isDone]` supports filtering non-Done lists

### Optimization Strategies
- Use `Prisma.$transaction` for toggle backlog (count + update) to ensure consistency
- For reorder, consider caching neighbor lists to calculate fractional index
- All operations target <100ms (PRD requirement: 95th percentile <100ms)

### Limits
- Maximum 10 non-Done lists per user (enforced in CreateList)
- Reordering is O(1) with fractional indexing (no bulk updates)

## 8. Implementation Steps

### Step 1: Add Shared Types
**File:** `packages/types/src/api/lists.ts`
- Add `UpdateListRequest` interface
- Add `UpdateListResponseDto` interface
- Add `ToggleBacklogResponseDto` interface
- Add `ReorderListRequest` interface
- Add `ReorderListResponseDto` interface

### Step 2: Create DTOs
**Files:**
- `apps/backend/src/lists/dto/update-list.dto.ts` - UpdateListDto class with validators
- `apps/backend/src/lists/dto/reorder-list.dto.ts` - ReorderListDto class with validators

### Step 3: Extend Repository
**File:** `apps/backend/src/lists/infra/lists.repository.ts`
- Add `update(id: string, userId: string, data: Partial<List>): Promise<List>`
- Add `countBacklogsByUserId(userId: string): Promise<number>`
- Add `findAdjacentLists(userId: string, afterListId: string): Promise<List[]>` (optional helper)

### Step 4: Create Use Cases
**Files:**
- `apps/backend/src/lists/use-cases/update-list.ts` - UpdateList class
- `apps/backend/src/lists/use-cases/update-list.spec.ts` - Tests
- `apps/backend/src/lists/use-cases/toggle-backlog.ts` - ToggleBacklog class
- `apps/backend/src/lists/use-cases/toggle-backlog.spec.ts` - Tests
- `apps/backend/src/lists/use-cases/reorder-list.ts` - ReorderList class
- `apps/backend/src/lists/use-cases/reorder-list.spec.ts` - Tests

**Use Case Structure (example for UpdateList):**
```typescript
@Injectable()
export class UpdateList {
  constructor(
    private readonly repository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UpdateList.name);
  }

  async execute(userId: string, listId: string, dto: UpdateListDto): Promise<ListDto> {
    this.logger.log(`Updating list ${listId} for user ${userId}`);

    try {
      const list = await this.repository.findOneByIdAndUser(listId, userId);

      if (!list) {
        throw new NotFoundException('List not found');
      }

      if (list.isDone) {
        throw new BadRequestException('Cannot rename the Done list');
      }

      const updated = await this.repository.update(listId, userId, { name: dto.name });

      this.logger.log(`Successfully updated list ${listId}`);
      return this.toDto(updated);
    } catch (error) {
      this.logger.error(`Failed to update list ${listId}`, error.stack);
      throw error;
    }
  }

  private toDto(list: List): ListDto {
    return {
      id: list.id,
      name: list.name,
      orderIndex: list.orderIndex,
      isBacklog: list.isBacklog,
      isDone: list.isDone,
      color: list.color,
      userId: list.userId,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }
}
```

### Step 5: Add Controller Endpoints
**File:** `apps/backend/src/lists/adapters/lists.controller.ts`
- Add `@Patch(':id')` method → calls UpdateList use case
- Add `@Post(':id/toggle-backlog')` method → calls ToggleBacklog use case
- Add `@Post(':id/reorder')` method → calls ReorderList use case

**Example:**
```typescript
@Patch(':id')
async updateList(
  @CurrentUser() user: JwtUser,
  @Param('id') id: string,
  @Body() dto: UpdateListDto,
): Promise<UpdateListResponseDto> {
  const list = await this.updateListUseCase.execute(user.id, id, dto);
  return { list };
}

@Post(':id/toggle-backlog')
async toggleBacklog(
  @CurrentUser() user: JwtUser,
  @Param('id') id: string,
): Promise<ToggleBacklogResponseDto> {
  const list = await this.toggleBacklogUseCase.execute(user.id, id);
  return { list };
}

@Post(':id/reorder')
async reorderList(
  @CurrentUser() user: JwtUser,
  @Param('id') id: string,
  @Body() dto: ReorderListDto,
): Promise<ReorderListResponseDto> {
  const list = await this.reorderListUseCase.execute(user.id, id, dto);
  return { list };
}
```

### Step 6: Update Module
**File:** `apps/backend/src/lists/lists.module.ts`
- Add `UpdateList`, `ToggleBacklog`, `ReorderList` to providers array
- Optionally export them if other modules need them

### Step 7: Write Tests
- Unit tests for each use case (mock repository, test business rules)
- Test error paths: NotFound, Forbidden, BadRequest
- Test toggle backlog constraint (cannot unmark last backlog)
- Test that Done list cannot be updated/toggled/reordered

### Step 8: Integration Testing
- E2E tests in `apps/backend/test/lists-management.e2e-spec.ts`
- Test full flows with real HTTP requests
- Verify JWT authentication works
- Test concurrent reorder operations

### Step 9: Swagger Documentation
- Add `@ApiOperation`, `@ApiResponse` decorators to controller methods
- Ensure DTOs are documented for OpenAPI spec generation

### Step 10: Update Project Tracker
- Mark Lists Management features as completed in `.ai/project-tracker.md`
- Update progress percentages

## 9. Testing Strategy

### Unit Tests
**UpdateList:**
- ✅ Successfully updates list name
- ✅ Throws NotFoundException for non-existent list
- ✅ Throws BadRequestException when trying to rename Done list
- ✅ Validates name length (1-100 chars)

**ToggleBacklog:**
- ✅ Successfully toggles backlog on (false → true)
- ✅ Successfully toggles backlog off (true → false) when >1 backlog exists
- ✅ Throws BadRequestException when trying to unmark last backlog
- ✅ Throws BadRequestException when trying to toggle Done list
- ✅ Throws NotFoundException for non-existent list

**ReorderList:**
- ✅ Successfully reorders with explicit newOrderIndex
- ✅ Successfully reorders with afterListId (fractional indexing)
- ✅ Throws BadRequestException when trying to reorder Done list
- ✅ Throws NotFoundException when afterListId doesn't exist
- ✅ Validates that at least one parameter is provided

### Integration Tests
- ✅ PATCH /v1/lists/:id returns 200 with updated list
- ✅ POST /v1/lists/:id/toggle-backlog returns 200 with toggled list
- ✅ POST /v1/lists/:id/reorder returns 200 with reordered list
- ✅ All endpoints return 401 without JWT
- ✅ All endpoints return 403 for lists owned by other users
- ✅ Verify orderIndex changes persist across requests

## 10. Open Questions & Post-MVP Considerations

### Reindexing Strategy
- **Question:** When should orderIndex values be reindexed to prevent precision issues?
- **MVP Approach:** Use fractional indexing without automatic reindexing
- **Post-MVP:** Implement background job to reindex when values get too small/large

### Backlog Grouping & Order
- **Question:** Should backlogs maintain a separate orderIndex namespace?
- **Current:** Backlogs and intermediates share orderIndex space, filtered by isBacklog
- **Alternative:** Separate ordering for backlogs (vertical) vs intermediates (horizontal)

### Reorder Constraints
- **Question:** Should reordering respect backlog grouping automatically?
- **MVP:** Client responsible for maintaining backlog leftmost position
- **Post-MVP:** Server could enforce that backlogs always have lower orderIndex than intermediates

## 11. Dependencies & Related Features

### Module Dependencies
- **ColorModule**: Already imported for list color assignment (CreateList)
- **AuthModule**: JWT guard for authentication
- **PrismaClient**: Database access

### Related Features
- **CreateList**: Sets initial orderIndex for new lists
- **DeleteList**: May need to promote intermediate to backlog if last backlog deleted
- **Tasks Reorder**: Similar fractional indexing pattern

### Affected User Stories
- US-001A: Mark list as backlog
- US-002: Rename list
- US-003A: Ensure at least one backlog
- US-004: Reorder lists
- US-004A: Backlogs leftmost grouping
