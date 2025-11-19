# Implementation Plan: Fix Origin Backlog Color Tracking

**Feature**: Origin Backlog Color Tracking Fix
**Type**: Bug Fix (Critical - Data Integrity & Core UX)
**PR Reference**: Issue identified in #5 code review
**Estimated Effort**: 1-2 days

## Problem Statement

Tasks should track their origin backlog and display with the origin backlog's color (PRD 3.1). Currently, this is broken:

- **Database**: No `originBacklogId` column in Task table
- **DTOs**: Hardcoded `originBacklogId: task.listId` (wrong - uses current list)
- **Color**: Hardcoded `color: '#3B82F6'` (wrong - should derive from origin backlog)
- **Impact**: Tasks lose visual origin when moved; core UX feature broken

## Solution Overview

1. Add `originBacklogId` column to Task table (Prisma migration)
2. Set origin backlog when task is created
3. Create shared `TaskMapper` utility to derive color from origin backlog
4. Replace all duplicated `toDto()` methods with `TaskMapper`
5. Handle edge cases (orphaned backlogs, deleted backlogs)

## Architecture

```
Tasks Feature
├── mappers/
│   └── task.mapper.ts           # NEW: Shared mapping logic
├── use-cases/
│   ├── create-task.ts           # MODIFIED: Set originBacklogId on creation
│   ├── get-tasks.ts             # MODIFIED: Use TaskMapper
│   ├── update-task.ts           # MODIFIED: Use TaskMapper
│   ├── move-task.ts             # MODIFIED: Use TaskMapper
│   ├── complete-task.ts         # MODIFIED: Use TaskMapper
│   └── reorder-task.ts          # MODIFIED: Use TaskMapper
└── infra/
    └── tasks.repository.ts      # MODIFIED: Add originBacklogId to queries

Done Feature
└── use-cases/
    └── get-done-tasks.ts        # MODIFIED: Use TaskMapper

Database
└── schema.prisma                # MODIFIED: Add originBacklogId column
```

## Implementation Steps

### Step 1: Database Schema Update

**File**: `apps/backend/prisma/schema.prisma`

**Changes**:
```prisma
model Task {
  id              String    @id @default(uuid())
  title           String
  description     String?
  orderIndex      Float     @map("order_index")
  listId          String    @map("list_id")
  originBacklogId String?   @map("origin_backlog_id")  // NEW: Nullable initially
  userId          String    @map("user_id")
  completedAt     DateTime? @map("completed_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  list           List  @relation("TaskList", fields: [listId], references: [id], onDelete: Cascade)
  originBacklog  List? @relation("TaskOriginBacklog", fields: [originBacklogId], references: [id], onDelete: SetNull)
  user           User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, listId, orderIndex])
  @@index([userId, completedAt])
  @@index([userId, originBacklogId])  // NEW: Index for efficient lookups
  @@map("tasks")
}

model List {
  id         String   @id @default(uuid())
  name       String
  orderIndex Float    @map("order_index")
  isBacklog  Boolean  @default(false) @map("is_backlog")
  isDone     Boolean  @default(false) @map("is_done")
  color      String?
  userId     String   @map("user_id")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user           User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks          Task[] @relation("TaskList")
  originTasks    Task[] @relation("TaskOriginBacklog")  // NEW: Tasks originating from this backlog

  @@index([userId, orderIndex])
  @@index([userId, isDone])
  @@map("lists")
}
```

**Migration Command**:
```bash
cd apps/backend
pnpm prisma migrate dev --name add_origin_backlog_tracking
```

**Data Migration Strategy**:
- `originBacklogId` starts as nullable to allow safe migration
- Backfill strategy: Set `originBacklogId` to first backlog for existing tasks
- Can be done in migration SQL or via script

**Backfill SQL** (in migration file):
```sql
-- For existing tasks, set originBacklogId to the user's first backlog
UPDATE tasks t
SET origin_backlog_id = (
  SELECT l.id
  FROM lists l
  WHERE l.user_id = t.user_id
    AND l.is_backlog = true
  ORDER BY l.order_index ASC
  LIMIT 1
)
WHERE t.origin_backlog_id IS NULL;
```

### Step 2: Create TaskMapper Utility

**File**: `apps/backend/src/tasks/mappers/task.mapper.ts` (NEW)

**Purpose**: Centralize DTO mapping logic, eliminate duplication, derive color from origin backlog

**Implementation**:
```typescript
import { Injectable } from '@nestjs/common';
import { Task, List } from '@prisma/client';
import { TaskDto } from '@gsd/types';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

export type TaskWithOrigin = Task & {
  originBacklog?: List | null;
};

@Injectable()
export class TaskMapper {
  private static readonly DEFAULT_COLOR = '#3B82F6'; // Fallback blue

  constructor(
    private readonly listsRepository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TaskMapper.name);
  }

  /**
   * Maps a single Task entity to TaskDto
   * Fetches origin backlog if not included
   */
  async toDto(task: Task): Promise<TaskDto> {
    const originBacklog = task.originBacklogId
      ? await this.listsRepository.findById(task.userId, task.originBacklogId)
      : null;

    return this.toDtoWithOrigin({ ...task, originBacklog });
  }

  /**
   * Maps a Task with preloaded originBacklog to TaskDto
   * Use this when origin backlog is already fetched (performance optimization)
   */
  toDtoWithOrigin(task: TaskWithOrigin): TaskDto {
    const color = this.getTaskColor(task.originBacklog);
    const originBacklogId = task.originBacklogId || task.listId; // Fallback to current list

    return {
      id: task.id,
      userId: task.userId,
      listId: task.listId,
      originBacklogId,
      title: task.title,
      description: task.description,
      orderIndex: task.orderIndex,
      color,
      isCompleted: task.completedAt !== null,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    };
  }

  /**
   * Maps multiple Tasks to TaskDtos
   * Optimized: fetches all origin backlogs in single query
   */
  async toDtos(tasks: Task[]): Promise<TaskDto[]> {
    if (tasks.length === 0) return [];

    const userId = tasks[0].userId;
    const backlogIds = [
      ...new Set(tasks.map((t) => t.originBacklogId).filter((id): id is string => !!id)),
    ];

    // Batch fetch all origin backlogs
    const backlogs = await this.listsRepository.findManyByIds(userId, backlogIds);
    const backlogMap = new Map(backlogs.map((b) => [b.id, b]));

    return tasks.map((task) => {
      const originBacklog = task.originBacklogId ? backlogMap.get(task.originBacklogId) : null;
      return this.toDtoWithOrigin({ ...task, originBacklog });
    });
  }

  /**
   * Derives task color from origin backlog
   * Fallback chain: backlog color → default color
   */
  private getTaskColor(originBacklog: List | null | undefined): string {
    if (originBacklog?.color) {
      return originBacklog.color;
    }

    this.logger.warn(
      `No origin backlog color found, using default: ${TaskMapper.DEFAULT_COLOR}`,
    );
    return TaskMapper.DEFAULT_COLOR;
  }
}
```

**Key Features**:
- Single source of truth for DTO mapping
- Performance optimization: batch fetch backlogs
- Graceful fallback when origin backlog is missing
- Clear separation of sync vs async mapping

### Step 3: Update ListsRepository

**File**: `apps/backend/src/lists/infra/lists.repository.ts`

**Add method**:
```typescript
/**
 * Find multiple lists by IDs (batch fetch)
 * Used by TaskMapper to efficiently fetch origin backlogs
 */
async findManyByIds(userId: string, listIds: string[]): Promise<List[]> {
  return this.prisma.list.findMany({
    where: {
      userId,
      id: { in: listIds },
    },
  });
}
```

### Step 4: Update CreateTask Use Case

**File**: `apps/backend/src/tasks/use-cases/create-task.ts`

**Changes**:
1. Resolve origin backlog ID when task is created
2. Store `originBacklogId` in database
3. Use `TaskMapper.toDto()` instead of local `toDto()`

**Implementation**:
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { TaskMapper } from '../mappers/task.mapper';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class CreateTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly taskMapper: TaskMapper,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CreateTask.name);
  }

  async execute(
    userId: string,
    listId: string,
    title: string,
    description?: string,
  ): Promise<TaskDto> {
    this.logger.log(`Creating task in list ${listId} for user ${userId}`);

    try {
      const list = await this.listsRepository.findById(userId, listId);
      if (!list) {
        throw new NotFoundException(`List with ID ${listId} not found`);
      }

      if (list.isDone) {
        throw new BadRequestException('Cannot create tasks in Done list');
      }

      const taskCount = await this.tasksRepository.countByListId(userId, listId);
      if (taskCount >= 100) {
        throw new BadRequestException('List has reached maximum of 100 tasks');
      }

      // NEW: Resolve origin backlog
      const originBacklogId = await this.resolveOriginBacklog(userId, list);

      const maxOrderIndex = await this.tasksRepository.findMaxOrderIndexByListId(userId, listId);
      const newOrderIndex = maxOrderIndex + 1000;

      const task = await this.tasksRepository.create({
        userId,
        listId,
        originBacklogId,  // NEW: Store origin backlog
        title,
        description: description || null,
        orderIndex: newOrderIndex,
      });

      this.logger.log(`Successfully created task ${task.id} with origin backlog ${originBacklogId}`);

      // NEW: Use TaskMapper instead of local toDto()
      return this.taskMapper.toDto(task);
    } catch (error) {
      this.logger.error(
        `Failed to create task for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Resolves the origin backlog for a new task
   * - If created in a backlog: use that backlog
   * - If created in intermediate list: use first backlog as default
   */
  private async resolveOriginBacklog(userId: string, targetList: List): Promise<string> {
    // If creating in a backlog, that's the origin
    if (targetList.isBacklog) {
      return targetList.id;
    }

    // If creating in intermediate list, find first backlog as default
    const backlogs = await this.listsRepository.findBacklogs(userId);
    if (backlogs.length === 0) {
      throw new Error('No backlog found for user. This is a data integrity issue.');
    }

    // Use first backlog by orderIndex
    const defaultBacklog = backlogs[0];
    this.logger.log(
      `Task created in intermediate list ${targetList.id}, using default backlog ${defaultBacklog.id}`,
    );
    return defaultBacklog.id;
  }
}
```

**Business Rule**:
- Task created in backlog → origin = that backlog
- Task created in intermediate list → origin = first backlog (by orderIndex)
- Tasks moved later keep their original origin

### Step 5: Update TasksRepository

**File**: `apps/backend/src/tasks/infra/tasks.repository.ts`

**Changes**:
1. Add `originBacklogId` to create method signature
2. Include `originBacklog` in Prisma includes for efficient fetching

**Implementation**:
```typescript
async create(data: {
  userId: string;
  listId: string;
  originBacklogId: string;  // NEW
  title: string;
  description: string | null;
  orderIndex: number;
}): Promise<Task> {
  return this.prisma.task.create({
    data: {
      userId: data.userId,
      listId: data.listId,
      originBacklogId: data.originBacklogId,  // NEW
      title: data.title,
      description: data.description,
      orderIndex: data.orderIndex,
    },
  });
}

// Optional: Include origin backlog in queries for performance
async findById(userId: string, taskId: string): Promise<TaskWithOrigin | null> {
  return this.prisma.task.findFirst({
    where: { id: taskId, userId },
    include: {
      originBacklog: true,  // NEW: Preload origin backlog
    },
  });
}

async findManyByListId(userId: string, listId: string): Promise<TaskWithOrigin[]> {
  return this.prisma.task.findMany({
    where: { userId, listId },
    include: {
      originBacklog: true,  // NEW: Preload origin backlog
    },
    orderBy: { orderIndex: 'asc' },
  });
}
```

### Step 6: Update All Use Cases to Use TaskMapper

**Files to modify**:
- `apps/backend/src/tasks/use-cases/get-tasks.ts`
- `apps/backend/src/tasks/use-cases/update-task.ts`
- `apps/backend/src/tasks/use-cases/move-task.ts`
- `apps/backend/src/tasks/use-cases/complete-task.ts`
- `apps/backend/src/tasks/use-cases/reorder-task.ts`
- `apps/backend/src/done/use-cases/get-done-tasks.ts`

**Pattern for each file**:
```typescript
// OLD: Local toDto() method
private toDto(task: Task): TaskDto {
  return {
    id: task.id,
    userId: task.userId,
    listId: task.listId,
    originBacklogId: task.listId,  // WRONG
    title: task.title,
    description: task.description,
    orderIndex: task.orderIndex,
    color: '#3B82F6',  // WRONG
    isCompleted: task.completedAt !== null,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  };
}

// NEW: Inject and use TaskMapper
import { TaskMapper } from '../mappers/task.mapper';

@Injectable()
export class SomeUseCase {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly taskMapper: TaskMapper,  // NEW
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SomeUseCase.name);
  }

  async execute(...): Promise<TaskDto> {
    // ... business logic ...
    const task = await this.tasksRepository.findById(userId, taskId);

    // NEW: Use mapper (async if origin backlog not preloaded)
    return this.taskMapper.toDto(task);

    // OR if origin backlog is already included in query:
    return this.taskMapper.toDtoWithOrigin(task);
  }
}
```

**GetTasks Optimization** (multiple tasks):
```typescript
async execute(userId: string, listId?: string): Promise<TaskDto[]> {
  const tasks = await this.tasksRepository.findMany(userId, listId);

  // Use batch mapping for performance
  return this.taskMapper.toDtos(tasks);
}
```

### Step 7: Update TasksModule Providers

**File**: `apps/backend/src/tasks/tasks.module.ts`

**Add TaskMapper**:
```typescript
import { TaskMapper } from './mappers/task.mapper';

@Module({
  imports: [ListsModule],  // Import to access ListsRepository
  providers: [
    // ... existing providers ...
    TaskMapper,  // NEW
  ],
  exports: [
    // ... existing exports ...
    TaskMapper,  // NEW: Export for DoneModule
  ],
})
export class TasksModule {}
```

### Step 8: Update DoneModule

**File**: `apps/backend/src/done/done.module.ts`

**Import TasksModule**:
```typescript
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],  // NEW: Import to access TaskMapper
  providers: [
    // ... existing providers ...
  ],
  controllers: [DoneController],
})
export class DoneModule {}
```

**File**: `apps/backend/src/done/use-cases/get-done-tasks.ts`

**Use TaskMapper**:
```typescript
import { TaskMapper } from '../../tasks/mappers/task.mapper';

@Injectable()
export class GetDoneTasks {
  constructor(
    private readonly doneRepository: DoneRepository,
    private readonly taskMapper: TaskMapper,  // NEW
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetDoneTasks.name);
  }

  async execute(userId: string, limit: number, offset: number): Promise<GetDoneTasksResponseDto> {
    const tasks = await this.doneRepository.findCompletedTasks(userId, limit, offset);
    const total = await this.doneRepository.countCompletedTasks(userId);

    // NEW: Use TaskMapper batch mapping
    const taskDtos = await this.taskMapper.toDtos(tasks);

    return {
      tasks: taskDtos,
      total,
      limit,
      offset,
    };
  }
}
```

## Testing Strategy

### Unit Tests

**TaskMapper Unit Tests** (`task.mapper.spec.ts`):
- ✅ Maps task with valid origin backlog
- ✅ Uses default color when origin backlog has no color
- ✅ Uses default color when origin backlog is null
- ✅ Batch mapping with multiple tasks
- ✅ Fallback to listId when originBacklogId is null
- ✅ Performance: batch fetch optimization

**CreateTask Unit Tests** (update existing):
- ✅ Sets origin backlog when creating in backlog
- ✅ Uses first backlog when creating in intermediate list
- ✅ Throws error when no backlog exists (data integrity)

**Other Use Cases** (update existing):
- ✅ Verify TaskMapper integration
- ✅ Mock TaskMapper.toDto() / toDtos()

### Integration Tests

**E2E Tests** (`tasks.e2e-spec.ts`):
- ✅ Task created in backlog has correct originBacklogId and color
- ✅ Task created in intermediate list uses first backlog
- ✅ Task moved to different list retains origin color
- ✅ Completed task in Done view shows origin color

**Data Migration Test**:
- ✅ Verify existing tasks get backfilled with origin backlog
- ✅ Verify no orphaned tasks after migration

## Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| Origin backlog deleted | `onDelete: SetNull` → `originBacklogId` = null → fallback to default color |
| No origin backlog color | Use `DEFAULT_COLOR` (#3B82F6) |
| Task created before migration | Backfilled with first backlog during migration |
| No backlogs exist (data corruption) | Throw `InternalServerErrorException` |
| Task moved between lists | Origin backlog remains unchanged (intentional) |

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Revert migration to remove `originBacklogId` column
2. **Code**: Revert to hardcoded values in use cases
3. **Data**: No data loss (column can be re-added later)

## Validation Checklist

Before merging:

- [ ] Prisma migration created and tested locally
- [ ] TaskMapper unit tests passing (100% coverage)
- [ ] All use cases updated to use TaskMapper
- [ ] No more duplicated toDto() methods
- [ ] E2E tests verify color tracking works end-to-end
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] All tests passing (backend)
- [ ] Migration backfill tested with sample data

## Performance Considerations

**Optimization 1: Batch Fetch**
- `TaskMapper.toDtos()` fetches all backlogs in single query
- Avoids N+1 query problem

**Optimization 2: Preload in Repository**
- Include `originBacklog` in Prisma queries
- Use `toDtoWithOrigin()` for sync mapping (no extra query)

**Expected Performance**:
- Single task: +1 query (acceptable)
- List of 100 tasks: +1 batch query (optimized)
- Done archive (50 tasks): +1 batch query (optimized)

## Dependencies

- **Prisma Migration**: `pnpm prisma migrate dev`
- **No new packages**: Uses existing dependencies

## Follow-up Work

After this fix:
- [ ] Consider caching backlog colors in-memory
- [ ] Add color validation in List creation
- [ ] Add user-customizable color palette (post-MVP)

---

**Estimated Timeline**:
- Step 1-2 (Schema + Mapper): 4 hours
- Step 3-5 (CreateTask + Repository): 2 hours
- Step 6-8 (Update all use cases): 4 hours
- Testing: 4 hours
- **Total**: 1-2 days

**Priority**: **HIGH** - Core UX feature, affects all task operations
