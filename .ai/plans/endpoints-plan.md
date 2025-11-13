# API Endpoint Implementation Plan: GSD REST API (Mocked)

## Analysis Summary

This implementation plan covers all REST API endpoints for the GSD application as specified in the OpenAPI specification, PRD, and tech stack documentation. Since the database is not yet available, all endpoints will use in-memory caching behind repository interfaces for easy future migration to Prisma/PostgreSQL.

**Key Architectural Decisions:**
- Use NestJS modular architecture with clear domain boundaries (Lists, Tasks, Done, Metrics)
- Implement repository pattern with in-memory implementations
- Use class-validator DTOs for request validation
- Follow SOLID principles with dependency injection
- Use fractional indexing (floats) for order_index to avoid frequent reindexing
- Store timestamps in UTC, convert to timezone in API responses
- Enforce business constraints (≥1 backlog, ≤10 non-Done lists, ≤100 tasks/list) in services

## 1. Endpoint Groups Overview

### Lists Module
Manages CRUD operations for user lists, including backlog toggling, reordering, and deletion with task relocation.

**Endpoints:**
- `GET /v1/lists` - Retrieve all lists for authenticated user
- `POST /v1/lists` - Create new list
- `GET /v1/lists/:id` - Get single list details
- `PATCH /v1/lists/:id` - Update list (rename)
- `DELETE /v1/lists/:id?dest=:destId` - Delete list with task destination
- `POST /v1/lists/:id/toggle-backlog` - Toggle backlog status
- `POST /v1/lists/:id/reorder` - Reorder list position

### Tasks Module
Manages task CRUD, moving between lists, reordering, completion, and bulk creation.

**Endpoints:**
- `GET /v1/tasks` - Get all tasks for user (with optional list filter)
- `POST /v1/tasks` - Create new task
- `GET /v1/tasks/:id` - Get single task
- `PATCH /v1/tasks/:id` - Update task (title, description)
- `DELETE /v1/tasks/:id` - Delete task
- `POST /v1/tasks/:id/move` - Move task to different list
- `POST /v1/tasks/:id/complete` - Complete task (moves to Done)
- `POST /v1/tasks/:id/reorder` - Reorder task within list
- `POST /v1/tasks/bulk-add` - Bulk create tasks (dump mode)

### Done Module
Read-only access to completed tasks with pagination and retention management.

**Endpoints:**
- `GET /v1/done` - Get paginated completed tasks

### Metrics Module
Aggregated completion statistics by day and week.

**Endpoints:**
- `GET /v1/metrics/daily` - Daily completion counts
- `GET /v1/metrics/weekly` - Weekly completion counts (week starts Monday)

### Health Module
Service health checks.

**Endpoints:**
- `GET /health/liveness` - Liveness probe
- `GET /health/readiness` - Readiness probe

## 2. Data Models and DTOs

### Core Domain Models

```typescript
// List entity
interface List {
  id: string;              // UUID
  userId: string;          // Foreign key to User
  name: string;            // User-defined name
  isBacklog: boolean;      // Backlog flag
  isDone: boolean;         // Special Done list flag
  orderIndex: number;      // Fractional index for ordering
  color: string;           // Hex color (for backlogs)
  createdAt: Date;
  updatedAt: Date;
}

// Task entity
interface Task {
  id: string;              // UUID
  userId: string;          // Foreign key to User
  listId: string;          // Foreign key to List
  title: string;           // Required
  description: string;     // Optional, nullable
  orderIndex: number;      // Fractional index for ordering within list
  completedAt: Date;       // Nullable, set when moved to Done
  createdAt: Date;
  updatedAt: Date;
}

// User (minimal for MVP)
interface User {
  id: string;              // UUID
  email: string;
  googleId: string;
  createdAt: Date;
}
```

### Request DTOs

```typescript
// Lists
class CreateListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsBoolean()
  isBacklog?: boolean;
}

class UpdateListDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;
}

class ReorderListDto {
  @IsNumber()
  @Min(0)
  newOrderIndex: number;
}

// Tasks
class CreateTaskDto {
  @IsString()
  @IsUUID()
  listId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

class MoveTaskDto {
  @IsString()
  @IsUUID()
  targetListId: string;
}

class ReorderTaskDto {
  @IsNumber()
  @Min(0)
  newOrderIndex: number;
}

class BulkAddTasksDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  titles: string[];

  @IsOptional()
  @IsString()
  @IsUUID()
  targetListId?: string; // Defaults to default backlog
}

// Metrics
class DailyMetricsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string; // ISO date

  @IsOptional()
  @IsDateString()
  endDate?: string; // ISO date

  @IsOptional()
  @IsString()
  timezone?: string; // IANA timezone, defaults to UTC
}

class WeeklyMetricsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  weeksCount?: number; // Default 4

  @IsOptional()
  @IsString()
  timezone?: string; // IANA timezone
}

// Pagination
class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number; // Default 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number; // Default 50
}
```

### Response DTOs

```typescript
class ListResponseDto {
  id: string;
  name: string;
  isBacklog: boolean;
  isDone: boolean;
  orderIndex: number;
  color: string;
  taskCount: number;
  createdAt: string; // ISO string
  updatedAt: string;
}

class TaskResponseDto {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

class PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class DailyMetricDto {
  date: string; // YYYY-MM-DD
  count: number;
}

class WeeklyMetricDto {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  count: number;
}

class ErrorResponseDto {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

## 3. Security Considerations

### Authentication
- All endpoints (except health checks) require JWT authentication
- Use `@UseGuards(JwtAuthGuard)` decorator on controllers
- JWT payload contains: `{ sub: userId, email: string }`
- Token stored in HttpOnly cookie for security

### Authorization
- All operations scoped to authenticated user
- Services validate userId matches authenticated user
- No cross-user data access

### Input Validation
- class-validator on all DTOs
- Global ValidationPipe with `{ whitelist: true, forbidNonWhitelisted: true }`
- SQL injection prevented by using parameterized queries (future Prisma)
- XSS prevented by not rendering user input as HTML

### Rate Limiting
- Apply `@Throttle()` decorator to mutation endpoints
- Limits: 100 requests per 15 minutes per user

### CORS
- Allow frontend origin only (http://localhost:4321 for dev)
- Credentials: true (for cookies)

## 4. Error Handling

### Business Logic Errors

| Scenario | Status Code | Message |
|----------|-------------|---------|
| List not found | 404 | "List not found" |
| Task not found | 404 | "Task not found" |
| Cannot delete last backlog | 400 | "Cannot delete the last backlog. At least one backlog must exist." |
| List limit exceeded (>10) | 400 | "Cannot create list. Maximum of 10 non-Done lists allowed." |
| Task limit exceeded (>100/list) | 400 | "Cannot create task. Maximum of 100 tasks per list allowed." |
| Invalid destination list for deletion | 400 | "Invalid destination list" |
| Cannot complete already completed task | 400 | "Task is already completed" |
| Invalid timezone | 400 | "Invalid timezone specified" |

### Validation Errors
- Status: 400
- Message: Array of validation error strings
- Example: `["name must be longer than 1 characters", "title should not be empty"]`

### Authentication Errors
- Status: 401
- Message: "Unauthorized"

### Server Errors
- Status: 500
- Message: "Internal server error"
- Log full error stack for debugging

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Cannot create list. Maximum of 10 non-Done lists allowed.",
  "error": "Bad Request",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "path": "/v1/lists"
}
```

## 5. In-Memory Repository Implementation

### Repository Interfaces

```typescript
// Allows future swap to Prisma implementation
interface IListRepository {
  findAll(userId: string): Promise<List[]>;
  findById(id: string, userId: string): Promise<List | null>;
  create(data: Partial<List>): Promise<List>;
  update(id: string, userId: string, data: Partial<List>): Promise<List>;
  delete(id: string, userId: string): Promise<void>;
  countNonDone(userId: string): Promise<number>;
  findDefaultBacklog(userId: string): Promise<List | null>;
  findDoneList(userId: string): Promise<List>;
}

interface ITaskRepository {
  findAll(userId: string, listId?: string): Promise<Task[]>;
  findById(id: string, userId: string): Promise<Task | null>;
  create(data: Partial<Task>): Promise<Task>;
  update(id: string, userId: string, data: Partial<Task>): Promise<Task>;
  delete(id: string, userId: string): Promise<void>;
  countByList(listId: string): Promise<number>;
  findCompleted(userId: string, page: number, limit: number): Promise<{ tasks: Task[]; total: number }>;
  bulkCreate(tasks: Partial<Task>[]): Promise<Task[]>;
  moveTasksToList(taskIds: string[], targetListId: string): Promise<void>;
}
```

### In-Memory Implementation Details

```typescript
@Injectable()
export class InMemoryListRepository implements IListRepository {
  private lists: Map<string, List> = new Map();
  private readonly logger = new Logger(InMemoryListRepository.name);

  constructor() {
    // Initialize with sample data for development
    this.seedData();
  }

  private seedData(): void {
    // Create sample users and lists
    const userId = 'user-123';

    // Create default Backlog
    const backlog: List = {
      id: 'list-1',
      userId,
      name: 'Backlog',
      isBacklog: true,
      isDone: false,
      orderIndex: 1.0,
      color: '#3b82f6',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create Today list
    const today: List = {
      id: 'list-2',
      userId,
      name: 'Today',
      isBacklog: false,
      isDone: false,
      orderIndex: 2.0,
      color: '#10b981',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create Done list
    const done: List = {
      id: 'list-done',
      userId,
      name: 'Done',
      isBacklog: false,
      isDone: true,
      orderIndex: 999.0,
      color: '#6b7280',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.lists.set(backlog.id, backlog);
    this.lists.set(today.id, today);
    this.lists.set(done.id, done);
  }

  async findAll(userId: string): Promise<List[]> {
    return Array.from(this.lists.values())
      .filter(list => list.userId === userId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async findById(id: string, userId: string): Promise<List | null> {
    const list = this.lists.get(id);
    return list && list.userId === userId ? list : null;
  }

  async create(data: Partial<List>): Promise<List> {
    const list: List = {
      id: `list-${Date.now()}`,
      userId: data.userId!,
      name: data.name!,
      isBacklog: data.isBacklog ?? false,
      isDone: false,
      orderIndex: data.orderIndex ?? Date.now(),
      color: data.color ?? this.generateColor(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.lists.set(list.id, list);
    return list;
  }

  async update(id: string, userId: string, data: Partial<List>): Promise<List> {
    const list = await this.findById(id, userId);
    if (!list) throw new NotFoundException('List not found');

    Object.assign(list, { ...data, updatedAt: new Date() });
    this.lists.set(id, list);
    return list;
  }

  async delete(id: string, userId: string): Promise<void> {
    const list = await this.findById(id, userId);
    if (!list) throw new NotFoundException('List not found');
    this.lists.delete(id);
  }

  async countNonDone(userId: string): Promise<number> {
    return Array.from(this.lists.values())
      .filter(list => list.userId === userId && !list.isDone)
      .length;
  }

  async findDefaultBacklog(userId: string): Promise<List | null> {
    const backlogs = Array.from(this.lists.values())
      .filter(list => list.userId === userId && list.isBacklog)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return backlogs[0] ?? null;
  }

  async findDoneList(userId: string): Promise<List> {
    const done = Array.from(this.lists.values())
      .find(list => list.userId === userId && list.isDone);
    if (!done) throw new Error('Done list not found');
    return done;
  }

  private generateColor(): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

@Injectable()
export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();
  private readonly logger = new Logger(InMemoryTaskRepository.name);

  constructor() {
    this.seedData();
  }

  private seedData(): void {
    const userId = 'user-123';
    const listId = 'list-1';

    const task1: Task = {
      id: 'task-1',
      userId,
      listId,
      title: 'Sample task 1',
      description: 'This is a sample task',
      orderIndex: 1.0,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const task2: Task = {
      id: 'task-2',
      userId,
      listId,
      title: 'Sample task 2',
      description: null,
      orderIndex: 2.0,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(task1.id, task1);
    this.tasks.set(task2.id, task2);
  }

  async findAll(userId: string, listId?: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => {
        if (task.userId !== userId) return false;
        if (listId && task.listId !== listId) return false;
        return true;
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async findById(id: string, userId: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task && task.userId === userId ? task : null;
  }

  async create(data: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: `task-${Date.now()}`,
      userId: data.userId!,
      listId: data.listId!,
      title: data.title!,
      description: data.description ?? null,
      orderIndex: data.orderIndex ?? Date.now(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, userId: string, data: Partial<Task>): Promise<Task> {
    const task = await this.findById(id, userId);
    if (!task) throw new NotFoundException('Task not found');

    Object.assign(task, { ...data, updatedAt: new Date() });
    this.tasks.set(id, task);
    return task;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findById(id, userId);
    if (!task) throw new NotFoundException('Task not found');
    this.tasks.delete(id);
  }

  async countByList(listId: string): Promise<number> {
    return Array.from(this.tasks.values())
      .filter(task => task.listId === listId)
      .length;
  }

  async findCompleted(userId: string, page: number, limit: number): Promise<{ tasks: Task[]; total: number }> {
    const completed = Array.from(this.tasks.values())
      .filter(task => task.userId === userId && task.completedAt !== null)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

    const total = completed.length;
    const offset = (page - 1) * limit;
    const tasks = completed.slice(offset, offset + limit);

    return { tasks, total };
  }

  async bulkCreate(tasks: Partial<Task>[]): Promise<Task[]> {
    return Promise.all(tasks.map(task => this.create(task)));
  }

  async moveTasksToList(taskIds: string[], targetListId: string): Promise<void> {
    for (const id of taskIds) {
      const task = this.tasks.get(id);
      if (task) {
        task.listId = targetListId;
        task.updatedAt = new Date();
      }
    }
  }
}
```

## 6. Service Layer Business Logic

### ListsService Key Methods

```typescript
@Injectable()
export class ListsService {
  constructor(
    private readonly listRepository: IListRepository,
    private readonly taskRepository: ITaskRepository,
  ) {}

  async create(userId: string, dto: CreateListDto): Promise<List> {
    // Validate limit
    const count = await this.listRepository.countNonDone(userId);
    if (count >= 10) {
      throw new BadRequestException('Cannot create list. Maximum of 10 non-Done lists allowed.');
    }

    // Calculate order index (append to end)
    const allLists = await this.listRepository.findAll(userId);
    const maxOrder = Math.max(...allLists.map(l => l.orderIndex), 0);
    const orderIndex = maxOrder + 1.0;

    return this.listRepository.create({
      userId,
      name: dto.name,
      isBacklog: dto.isBacklog ?? false,
      orderIndex,
      color: this.generateBacklogColor(),
    });
  }

  async toggleBacklog(userId: string, listId: string): Promise<List> {
    const list = await this.listRepository.findById(listId, userId);
    if (!list) throw new NotFoundException('List not found');
    if (list.isDone) throw new BadRequestException('Cannot toggle Done list');

    // If unmarking, ensure at least one backlog remains
    if (list.isBacklog) {
      const backlogs = (await this.listRepository.findAll(userId))
        .filter(l => l.isBacklog && l.id !== listId);
      if (backlogs.length === 0) {
        throw new BadRequestException('Cannot unmark the last backlog. At least one backlog must exist.');
      }
    }

    return this.listRepository.update(listId, userId, { isBacklog: !list.isBacklog });
  }

  async delete(userId: string, listId: string, destId: string): Promise<void> {
    const list = await this.listRepository.findById(listId, userId);
    if (!list) throw new NotFoundException('List not found');
    if (list.isDone) throw new BadRequestException('Cannot delete Done list');

    // Validate destination
    const destList = await this.listRepository.findById(destId, userId);
    if (!destList || destList.isDone) {
      throw new BadRequestException('Invalid destination list');
    }

    // Ensure at least one backlog remains
    if (list.isBacklog) {
      const backlogs = (await this.listRepository.findAll(userId))
        .filter(l => l.isBacklog && l.id !== listId);
      if (backlogs.length === 0) {
        throw new BadRequestException('Cannot delete the last backlog. At least one backlog must exist.');
      }
    }

    // Move tasks to destination
    const tasks = await this.taskRepository.findAll(userId, listId);
    if (tasks.length > 0) {
      await this.taskRepository.moveTasksToList(
        tasks.map(t => t.id),
        destId
      );
    }

    // Delete list
    await this.listRepository.delete(listId, userId);
  }

  private generateBacklogColor(): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
```

### TasksService Key Methods

```typescript
@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly listRepository: IListRepository,
  ) {}

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    // Validate list exists
    const list = await this.listRepository.findById(dto.listId, userId);
    if (!list) throw new NotFoundException('List not found');
    if (list.isDone) throw new BadRequestException('Cannot create tasks in Done list');

    // Validate limit
    const count = await this.taskRepository.countByList(dto.listId);
    if (count >= 100) {
      throw new BadRequestException('Cannot create task. Maximum of 100 tasks per list allowed.');
    }

    // Insert at top (orderIndex = 0.5)
    const tasks = await this.taskRepository.findAll(userId, dto.listId);
    const minOrder = tasks.length > 0 ? Math.min(...tasks.map(t => t.orderIndex)) : 1.0;
    const orderIndex = minOrder / 2;

    return this.taskRepository.create({
      userId,
      listId: dto.listId,
      title: dto.title,
      description: dto.description,
      orderIndex,
    });
  }

  async move(userId: string, taskId: string, dto: MoveTaskDto): Promise<Task> {
    const task = await this.taskRepository.findById(taskId, userId);
    if (!task) throw new NotFoundException('Task not found');
    if (task.completedAt) throw new BadRequestException('Cannot move completed task');

    // Validate target list
    const targetList = await this.listRepository.findById(dto.targetListId, userId);
    if (!targetList) throw new NotFoundException('Target list not found');
    if (targetList.isDone) throw new BadRequestException('Cannot move to Done list directly. Use complete endpoint.');

    // Validate target list limit
    const count = await this.taskRepository.countByList(dto.targetListId);
    if (count >= 100) {
      throw new BadRequestException('Cannot move task. Target list has reached maximum of 100 tasks.');
    }

    // Insert at top of target list
    const targetTasks = await this.taskRepository.findAll(userId, dto.targetListId);
    const minOrder = targetTasks.length > 0 ? Math.min(...targetTasks.map(t => t.orderIndex)) : 1.0;
    const orderIndex = minOrder / 2;

    return this.taskRepository.update(taskId, userId, {
      listId: dto.targetListId,
      orderIndex,
    });
  }

  async complete(userId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId, userId);
    if (!task) throw new NotFoundException('Task not found');
    if (task.completedAt) throw new BadRequestException('Task is already completed');

    // Get Done list
    const doneList = await this.listRepository.findDoneList(userId);

    // Move to Done and set completedAt
    return this.taskRepository.update(taskId, userId, {
      listId: doneList.id,
      completedAt: new Date(),
    });
  }

  async bulkAdd(userId: string, dto: BulkAddTasksDto): Promise<Task[]> {
    // Get target list (default backlog if not specified)
    let targetListId = dto.targetListId;
    if (!targetListId) {
      const defaultBacklog = await this.listRepository.findDefaultBacklog(userId);
      if (!defaultBacklog) throw new BadRequestException('No backlog found');
      targetListId = defaultBacklog.id;
    }

    // Validate list
    const list = await this.listRepository.findById(targetListId, userId);
    if (!list) throw new NotFoundException('List not found');
    if (list.isDone) throw new BadRequestException('Cannot add tasks to Done list');

    // Validate limit
    const currentCount = await this.taskRepository.countByList(targetListId);
    const newCount = currentCount + dto.titles.length;
    if (newCount > 100) {
      throw new BadRequestException(
        `Cannot add ${dto.titles.length} tasks. List limit is 100 tasks (current: ${currentCount})`
      );
    }

    // Create tasks at top
    const tasks = await this.taskRepository.findAll(userId, targetListId);
    const minOrder = tasks.length > 0 ? Math.min(...tasks.map(t => t.orderIndex)) : 1.0;

    const tasksData = dto.titles.map((title, index) => ({
      userId,
      listId: targetListId,
      title,
      description: null,
      orderIndex: minOrder / (2 + index), // Stack at top
    }));

    return this.taskRepository.bulkCreate(tasksData);
  }
}
```

### MetricsService

```typescript
@Injectable()
export class MetricsService {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async getDailyMetrics(userId: string, startDate?: Date, endDate?: Date, timezone = 'UTC'): Promise<DailyMetricDto[]> {
    const allTasks = await this.taskRepository.findAll(userId);
    const completed = allTasks.filter(t => t.completedAt !== null);

    // Group by date in specified timezone
    const grouped = new Map<string, number>();

    for (const task of completed) {
      const date = this.toTimezone(task.completedAt!, timezone);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      grouped.set(dateKey, (grouped.get(dateKey) || 0) + 1);
    }

    // Filter by date range if specified
    const metrics: DailyMetricDto[] = [];
    for (const [date, count] of grouped.entries()) {
      if (startDate && new Date(date) < startDate) continue;
      if (endDate && new Date(date) > endDate) continue;
      metrics.push({ date, count });
    }

    return metrics.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getWeeklyMetrics(userId: string, weeksCount = 4, timezone = 'UTC'): Promise<WeeklyMetricDto[]> {
    const allTasks = await this.taskRepository.findAll(userId);
    const completed = allTasks.filter(t => t.completedAt !== null);

    // Group by week (Monday start)
    const grouped = new Map<string, number>();

    for (const task of completed) {
      const date = this.toTimezone(task.completedAt!, timezone);
      const weekStart = this.getWeekStart(date); // Monday
      const weekKey = weekStart.toISOString().split('T')[0];
      grouped.set(weekKey, (grouped.get(weekKey) || 0) + 1);
    }

    // Convert to response
    const metrics: WeeklyMetricDto[] = [];
    for (const [weekStart, count] of grouped.entries()) {
      const startDate = new Date(weekStart);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Sunday

      metrics.push({
        weekStart,
        weekEnd: endDate.toISOString().split('T')[0],
        count,
      });
    }

    return metrics
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      .slice(0, weeksCount);
  }

  private toTimezone(date: Date, timezone: string): Date {
    // For in-memory implementation, simplified timezone handling
    // In production, use library like date-fns-tz or luxon
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  }

  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday is 1
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
}
```

## 7. Performance Considerations

### Fractional Indexing
- Use float for orderIndex to avoid frequent reindexing
- Insert at top: `newIndex = minIndex / 2`
- Insert between: `newIndex = (prevIndex + nextIndex) / 2`
- Reindex job (future): when precision loss occurs, reassign indices with spacing

### In-Memory Limitations
- Current implementation stores all data in memory (lost on restart)
- Not suitable for production; migrate to Prisma after initial dev
- No transaction support in current implementation

### Query Optimization (Future with Prisma)
- Index on: user_id, list_id, completed_at, order_index
- Use cursor-based pagination for large result sets
- Eager load counts with single query: `include: { _count: { select: { tasks: true } } }`

## 8. Implementation Steps

### Phase 1: Module Setup
1. Create NestJS modules: ListsModule, TasksModule, DoneModule, MetricsModule, HealthModule
2. Set up repository interfaces and in-memory implementations
3. Configure global ValidationPipe and exception filters
4. Set up JWT authentication guard (mock for now)

### Phase 2: Lists Module
1. Create DTOs: CreateListDto, UpdateListDto, ReorderListDto
2. Implement ListsController with all endpoints
3. Implement ListsService with business logic:
   - Create with limit validation
   - Toggle backlog with constraint enforcement
   - Delete with task migration
   - Reorder with fractional indexing
4. Add Swagger decorators for API documentation

### Phase 3: Tasks Module
1. Create DTOs: CreateTaskDto, UpdateTaskDto, MoveTaskDto, ReorderTaskDto, BulkAddTasksDto
2. Implement TasksController with all endpoints
3. Implement TasksService:
   - CRUD operations with validation
   - Move with limit checks
   - Complete (move to Done)
   - Bulk add with limit validation
   - Reorder with fractional indexing
4. Add Swagger decorators

### Phase 4: Done Module
1. Create PaginationQueryDto
2. Implement DoneController with GET endpoint
3. Implement DoneService with pagination logic
4. Add retention job (scheduled task for future)

### Phase 5: Metrics Module
1. Create MetricsQueryDto types
2. Implement MetricsController
3. Implement MetricsService with date/week aggregation
4. Add timezone handling

### Phase 6: Health Module
1. Implement HealthController with liveness/readiness
2. Add basic health indicators

### Phase 7: Integration
1. Wire up all modules in AppModule
2. Configure CORS for frontend
3. Test all endpoints with Postman/Thunder Client
4. Update OpenAPI spec if needed

### Phase 8: Testing
1. Write unit tests for services (business logic)
2. Write e2e tests for critical flows:
   - List creation/deletion with constraints
   - Task completion flow
   - Bulk add with limits
3. Test error scenarios

### Phase 9: Documentation
1. Complete Swagger documentation
2. Add inline code comments for complex logic
3. Update README with API usage examples

### Phase 10: Prepare for Database Migration
1. Document repository interface contracts
2. Create Prisma schema matching in-memory models
3. Plan migration strategy from in-memory to Prisma
