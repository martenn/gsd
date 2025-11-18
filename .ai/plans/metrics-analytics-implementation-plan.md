# Feature Implementation Plan: Metrics & Analytics Module

## 1. Feature Overview

This plan covers the complete implementation of the **MetricsModule** - a new backend module for tracking and reporting user productivity metrics based on completed tasks.

### Endpoints to Implement

1. **Daily Metrics** - `GET /v1/metrics/daily`
2. **Weekly Metrics** - `GET /v1/metrics/weekly`

### Business Context

The Metrics & Analytics module supports the primary KPI for GSD: **tasks completed per user per week** (target: 10+ at MVP). This encourages users to maintain momentum and provides visibility into their productivity patterns.

From the PRD (Section 3.8):

> **3.8 Metrics**
>
> - Track counts of tasks completed per user per day and per week.
> - Store timestamps in UTC; present in browser timezone; week starts Monday.
> - Goal: encourage 10+ tasks completed per user per week.

From Success Metrics (Section 6):

> **Primary KPI:**
>
> - Tasks completed per user per week (target: 10+ at MVP)
> - Secondary: tasks completed per user per day

### User Story (US-016)

> **User Story US-016: Metrics display**
> As a user, I can view counts of tasks I completed per day and per week.
>
> **Acceptance Criteria:**
>
> - The system aggregates completed_at timestamps into daily/weekly counts using the browser timezone
> - Week starts Monday

## 2. Current Implementation Status

**Status:** ❌ Not implemented

**Related Existing Features:**

- ✅ Task model has `completedAt` timestamp (UTC)
- ✅ `CompleteTask` use case sets `completedAt` when tasks are completed
- ✅ Done module tracks completed tasks (paginated view)

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

  @@index([userId, completedAt])  // ✅ Index exists for metrics queries
}
```

**Missing:**

- ❌ MetricsModule (module, controller, use cases, repository)
- ❌ API endpoints for daily/weekly metrics
- ❌ Aggregation logic for grouping by day/week
- ❌ Timezone handling (UTC storage → user timezone presentation)
- ❌ Shared types for metrics responses

## 3. API Specification

### Endpoint 1: Daily Metrics

**Request:**

```
GET /v1/metrics/daily?startDate=2025-11-01&endDate=2025-11-15&timezone=America/New_York
```

**Query Parameters:**

- `startDate` (optional): ISO date string (e.g., "2025-11-01"). Defaults to 30 days ago.
- `endDate` (optional): ISO date string (e.g., "2025-11-15"). Defaults to today.
- `timezone` (optional): IANA timezone string (e.g., "America/New_York", "Europe/London"). Defaults to "UTC".

**Response (200 OK):**

```typescript
{
  "metrics": [
    {
      "date": "2025-11-01",
      "count": 5,
      "timezone": "America/New_York"
    },
    {
      "date": "2025-11-02",
      "count": 8,
      "timezone": "America/New_York"
    },
    // ... more days
  ],
  "startDate": "2025-11-01",
  "endDate": "2025-11-15",
  "timezone": "America/New_York",
  "totalCompleted": 78
}
```

### Endpoint 2: Weekly Metrics

**Request:**

```
GET /v1/metrics/weekly?startDate=2025-10-01&endDate=2025-11-15&timezone=America/New_York
```

**Query Parameters:**

- `startDate` (optional): ISO date string. Defaults to 12 weeks ago.
- `endDate` (optional): ISO date string. Defaults to today.
- `timezone` (optional): IANA timezone string. Defaults to "UTC".

**Response (200 OK):**

```typescript
{
  "metrics": [
    {
      "weekStartDate": "2025-10-28", // Monday
      "weekEndDate": "2025-11-03",   // Sunday
      "count": 12,
      "timezone": "America/New_York"
    },
    {
      "weekStartDate": "2025-11-04",
      "weekEndDate": "2025-11-10",
      "count": 15,
      "timezone": "America/New_York"
    },
    // ... more weeks
  ],
  "startDate": "2025-10-01",
  "endDate": "2025-11-15",
  "timezone": "America/New_York",
  "totalCompleted": 78,
  "totalWeeks": 6
}
```

**Week Definition:**

- Week starts Monday (ISO 8601 week date system)
- Week ends Sunday
- Partial weeks at start/end of range are included

## 4. Types & DTOs

### Shared Types (packages/types/src/api/metrics.ts)

```typescript
export interface DailyMetric {
  date: string; // ISO date string (YYYY-MM-DD)
  count: number;
  timezone: string;
}

export interface WeeklyMetric {
  weekStartDate: string; // Monday (YYYY-MM-DD)
  weekEndDate: string; // Sunday (YYYY-MM-DD)
  count: number;
  timezone: string;
}

export interface GetDailyMetricsQuery {
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface GetWeeklyMetricsQuery {
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface DailyMetricsResponseDto {
  metrics: DailyMetric[];
  startDate: string;
  endDate: string;
  timezone: string;
  totalCompleted: number;
}

export interface WeeklyMetricsResponseDto {
  metrics: WeeklyMetric[];
  startDate: string;
  endDate: string;
  timezone: string;
  totalCompleted: number;
  totalWeeks: number;
}
```

### Backend DTOs

**File:** `apps/backend/src/metrics/dto/get-daily-metrics-query.dto.ts`

```typescript
import { IsOptional, IsString, Matches, IsISO8601 } from 'class-validator';
import { GetDailyMetricsQuery } from '@gsd/types';

export class GetDailyMetricsQueryDto implements GetDailyMetricsQuery {
  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]+\/[A-Za-z_]+$/, {
    message: 'Invalid timezone format. Use IANA timezone (e.g., America/New_York)',
  })
  timezone?: string;
}
```

**File:** `apps/backend/src/metrics/dto/get-weekly-metrics-query.dto.ts`

```typescript
import { IsOptional, IsString, Matches, IsISO8601 } from 'class-validator';
import { GetWeeklyMetricsQuery } from '@gsd/types';

export class GetWeeklyMetricsQueryDto implements GetWeeklyMetricsQuery {
  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]+\/[A-Za-z_]+$/, {
    message: 'Invalid timezone format. Use IANA timezone (e.g., America/New_York)',
  })
  timezone?: string;
}
```

## 5. Data Flow

### Daily Metrics Flow

```
┌─────────┐      ┌────────────┐      ┌──────────────┐      ┌────────────────┐
│ Client  │      │ Controller │      │ GetDaily     │      │ Metrics        │
│         │      │            │      │ Metrics      │      │ Repository     │
│         │      │            │      │ Use Case     │      │                │
└────┬────┘      └─────┬──────┘      └──────┬───────┘      └───────┬────────┘
     │                 │                    │                      │
     │ GET /metrics/   │                    │                      │
     │ daily?timezone  │                    │                      │
     ├────────────────>│                    │                      │
     │                 │                    │                      │
     │                 │ Validate query     │                      │
     │                 │ Extract user ID    │                      │
     │                 │                    │                      │
     │                 │ execute(userId,    │                      │
     │                 │   query)           │                      │
     │                 ├───────────────────>│                      │
     │                 │                    │                      │
     │                 │                    │ Parse dates          │
     │                 │                    │ Default timezone     │
     │                 │                    │                      │
     │                 │                    │ getCompletedTasks()  │
     │                 │                    ├─────────────────────>│
     │                 │                    │<─────────────────────┤
     │                 │                    │  Task[] with         │
     │                 │                    │  completedAt (UTC)   │
     │                 │                    │                      │
     │                 │                    │ Group by day         │
     │                 │                    │ (convert to TZ)      │
     │                 │                    │                      │
     │                 │ DailyMetricsDto    │                      │
     │                 │<───────────────────┤                      │
     │                 │                    │                      │
     │ 200 OK          │                    │                      │
     │<────────────────┤                    │                      │
     │ Response        │                    │                      │
```

### Weekly Metrics Flow

(Similar to daily, but with additional week calculation logic)

## 6. Algorithm Details

### Daily Metrics Aggregation

```typescript
// Pseudo-code for daily aggregation
async getDailyMetrics(userId: string, query: GetDailyMetricsQueryDto) {
  // 1. Parse and default parameters
  const startDate = query.startDate || getDateDaysAgo(30);
  const endDate = query.endDate || getTodayDate();
  const timezone = query.timezone || 'UTC';

  // 2. Fetch completed tasks in UTC range
  // Convert user's date range to UTC bounds
  const utcStart = convertToUTCStart(startDate, timezone);
  const utcEnd = convertToUTCEnd(endDate, timezone);

  const tasks = await repository.getCompletedTasksByDateRange(
    userId,
    utcStart,
    utcEnd
  );

  // 3. Group by day in user's timezone
  const dailyMap = new Map<string, number>();

  for (const task of tasks) {
    const localDate = convertToTimezone(task.completedAt, timezone);
    const dateKey = formatAsISODate(localDate); // YYYY-MM-DD

    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
  }

  // 4. Build metrics array (fill gaps with 0 counts)
  const metrics: DailyMetric[] = [];
  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (currentDate <= endDateObj) {
    const dateKey = formatAsISODate(currentDate);
    metrics.push({
      date: dateKey,
      count: dailyMap.get(dateKey) || 0,
      timezone,
    });
    currentDate = addDays(currentDate, 1);
  }

  // 5. Return response
  return {
    metrics,
    startDate,
    endDate,
    timezone,
    totalCompleted: tasks.length,
  };
}
```

### Weekly Metrics Aggregation

```typescript
// Pseudo-code for weekly aggregation
async getWeeklyMetrics(userId: string, query: GetWeeklyMetricsQueryDto) {
  // 1. Parse and default parameters
  const startDate = query.startDate || getDateWeeksAgo(12);
  const endDate = query.endDate || getTodayDate();
  const timezone = query.timezone || 'UTC';

  // 2. Fetch completed tasks
  const utcStart = convertToUTCStart(startDate, timezone);
  const utcEnd = convertToUTCEnd(endDate, timezone);

  const tasks = await repository.getCompletedTasksByDateRange(
    userId,
    utcStart,
    utcEnd
  );

  // 3. Group by week (Monday-Sunday) in user's timezone
  const weeklyMap = new Map<string, { start: string; end: string; count: number }>();

  for (const task of tasks) {
    const localDate = convertToTimezone(task.completedAt, timezone);
    const weekStart = getMonday(localDate); // ISO week starts Monday
    const weekEnd = getSunday(weekStart);
    const weekKey = formatAsISODate(weekStart);

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        start: weekKey,
        end: formatAsISODate(weekEnd),
        count: 0,
      });
    }

    weeklyMap.get(weekKey).count += 1;
  }

  // 4. Build metrics array (fill gaps with 0 counts)
  const metrics: WeeklyMetric[] = [];
  let currentWeekStart = getMonday(new Date(startDate));
  const endDateObj = new Date(endDate);

  while (currentWeekStart <= endDateObj) {
    const weekKey = formatAsISODate(currentWeekStart);
    const weekEnd = getSunday(currentWeekStart);

    const existing = weeklyMap.get(weekKey);

    metrics.push({
      weekStartDate: weekKey,
      weekEndDate: formatAsISODate(weekEnd),
      count: existing?.count || 0,
      timezone,
    });

    currentWeekStart = addDays(currentWeekStart, 7); // Next Monday
  }

  // 5. Return response
  return {
    metrics,
    startDate,
    endDate,
    timezone,
    totalCompleted: tasks.length,
    totalWeeks: metrics.length,
  };
}
```

### Timezone Conversion Helpers

**Library:** Use `date-fns-tz` for timezone conversions

```typescript
import { utcToZonedTime, zonedTimeToUtc, format } from 'date-fns-tz';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

function convertToUTCStart(dateStr: string, timezone: string): Date {
  const localDate = new Date(dateStr);
  const startOfDayLocal = startOfDay(localDate);
  return zonedTimeToUtc(startOfDayLocal, timezone);
}

function convertToUTCEnd(dateStr: string, timezone: string): Date {
  const localDate = new Date(dateStr);
  const endOfDayLocal = endOfDay(localDate);
  return zonedTimeToUtc(endOfDayLocal, timezone);
}

function convertToTimezone(utcDate: Date, timezone: string): Date {
  return utcToZonedTime(utcDate, timezone);
}

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
}

function getSunday(mondayDate: Date): Date {
  return endOfWeek(mondayDate, { weekStartsOn: 1 });
}
```

## 7. Security Considerations

### Authentication & Authorization

- ✅ All endpoints protected by `@UseGuards(JwtAuthGuard)`
- ✅ User ID extracted from JWT via `@CurrentUser()` decorator
- ✅ Queries scoped by userId (users can only see their own metrics)

### Input Validation

- ✅ Date format: ISO 8601 validated by `@IsISO8601`
- ✅ Timezone format: IANA timezone string regex pattern
- ✅ Date range: Prevent excessively large ranges (e.g., max 1 year)

### Potential Threats

**1. Information Disclosure**

- ✅ Mitigated: All queries filter by userId from JWT
- ✅ Cannot query other users' metrics

**2. Resource Exhaustion (DoS)**

- ⚠️ Potential Issue: Very large date ranges could query thousands of tasks
- ✅ Mitigation: Limit date range to 1 year max
- ✅ Use indexed query on `[userId, completedAt]`

**3. Invalid Timezone Attack**

- ✅ Mitigated: Regex validation for timezone format
- ✅ Use `date-fns-tz` which handles invalid timezones gracefully

**4. SQL Injection**

- ✅ Mitigated: Prisma ORM uses parameterized queries

## 8. Error Handling

### Validation Errors (400 Bad Request)

```typescript
// Invalid date format
{
  "statusCode": 400,
  "message": ["startDate must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}

// Invalid timezone
{
  "statusCode": 400,
  "message": ["Invalid timezone format. Use IANA timezone (e.g., America/New_York)"],
  "error": "Bad Request"
}

// Date range too large
{
  "statusCode": 400,
  "message": "Date range cannot exceed 1 year",
  "error": "Bad Request"
}

// End date before start date
{
  "statusCode": 400,
  "message": "End date must be after start date",
  "error": "Bad Request"
}
```

### Authorization Errors (401 Unauthorized)

```typescript
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Server Errors (500)

```typescript
{
  "statusCode": 500,
  "message": "Failed to fetch metrics",
  "error": "Internal Server Error"
}
```

## 9. Performance Considerations

### Database Queries

**Daily Metrics:**

- 1 SELECT query with WHERE userId AND completedAt BETWEEN
- Uses index: `[userId, completedAt]`
- Aggregation done in-memory (not database)

**Weekly Metrics:**

- Same as daily (1 SELECT query)
- Grouping logic in application layer

### Query Optimization

```sql
-- Optimized query (via Prisma)
SELECT * FROM tasks
WHERE user_id = ?
  AND completed_at IS NOT NULL
  AND completed_at >= ?
  AND completed_at <= ?
ORDER BY completed_at ASC;
```

**Index Usage:**

- Existing index `[userId, completedAt]` covers this query perfectly
- Expected query time: <10ms for 1000 tasks

### In-Memory Aggregation

- Maximum tasks in date range: ~1000 (30 days × ~33 tasks/day)
- Memory footprint: ~100KB for 1000 tasks
- Aggregation time: <10ms

### Response Size

- Daily metrics (30 days): ~2KB JSON
- Weekly metrics (12 weeks): ~1KB JSON
- Well within acceptable limits

### Caching Strategy (Post-MVP)

- Daily metrics can be cached (don't change for past dates)
- Cache key: `metrics:daily:${userId}:${date}`
- TTL: 24 hours for today, permanent for past dates
- Use Redis or in-memory cache

### Target Performance

- **Goal:** 95th percentile <100ms
- **Expected:** 50-80ms (query 10ms + aggregation 10ms + network 30ms)

## 10. Implementation Steps

### Step 1: Install Dependencies

```bash
pnpm add date-fns date-fns-tz
```

### Step 2: Create Shared Types

**File:** `packages/types/src/api/metrics.ts`

- Add all interfaces (DailyMetric, WeeklyMetric, queries, responses)

**File:** `packages/types/src/index.ts`

- Export metrics types

### Step 3: Create Backend DTOs

**Files:**

- `apps/backend/src/metrics/dto/get-daily-metrics-query.dto.ts`
- `apps/backend/src/metrics/dto/get-weekly-metrics-query.dto.ts`

### Step 4: Create MetricsRepository

**File:** `apps/backend/src/metrics/infra/metrics.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient, Task } from '@prisma/client';

@Injectable()
export class MetricsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getCompletedTasksByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });
  }
}
```

### Step 5: Create Use Cases

**File:** `apps/backend/src/metrics/use-cases/get-daily-metrics.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { DailyMetricsResponseDto, DailyMetric } from '@gsd/types';
import { MetricsRepository } from '../infra/metrics.repository';
import { GetDailyMetricsQueryDto } from '../dto/get-daily-metrics-query.dto';
import { AppLogger } from '../../logger/app-logger';
import { startOfDay, endOfDay, addDays, differenceInDays, format } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

@Injectable()
export class GetDailyMetrics {
  constructor(
    private readonly repository: MetricsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetDailyMetrics.name);
  }

  async execute(userId: string, query: GetDailyMetricsQueryDto): Promise<DailyMetricsResponseDto> {
    this.logger.log(`Fetching daily metrics for user ${userId}`);

    try {
      // Default parameters
      const timezone = query.timezone || 'UTC';
      const endDate = query.endDate || format(new Date(), 'yyyy-MM-dd');
      const startDate = query.startDate || format(addDays(new Date(endDate), -30), 'yyyy-MM-dd');

      // Validate date range
      this.validateDateRange(startDate, endDate);

      // Convert to UTC bounds
      const utcStart = this.convertToUTCStart(startDate, timezone);
      const utcEnd = this.convertToUTCEnd(endDate, timezone);

      // Fetch completed tasks
      const tasks = await this.repository.getCompletedTasksByDateRange(userId, utcStart, utcEnd);

      // Aggregate by day
      const metrics = this.aggregateByDay(tasks, startDate, endDate, timezone);

      this.logger.log(`Returning ${metrics.length} daily metrics for user ${userId}`);

      return {
        metrics,
        startDate,
        endDate,
        timezone,
        totalCompleted: tasks.length,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch daily metrics for user ${userId}`, error.stack);
      throw error;
    }
  }

  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    const daysDiff = differenceInDays(end, start);
    if (daysDiff > 365) {
      throw new BadRequestException('Date range cannot exceed 1 year');
    }
  }

  private convertToUTCStart(dateStr: string, timezone: string): Date {
    const localDate = new Date(dateStr);
    const startOfDayLocal = startOfDay(localDate);
    return zonedTimeToUtc(startOfDayLocal, timezone);
  }

  private convertToUTCEnd(dateStr: string, timezone: string): Date {
    const localDate = new Date(dateStr);
    const endOfDayLocal = endOfDay(localDate);
    return zonedTimeToUtc(endOfDayLocal, timezone);
  }

  private aggregateByDay(
    tasks: Task[],
    startDate: string,
    endDate: string,
    timezone: string,
  ): DailyMetric[] {
    // Group tasks by day
    const dailyMap = new Map<string, number>();

    for (const task of tasks) {
      if (!task.completedAt) continue;

      const localDate = utcToZonedTime(task.completedAt, timezone);
      const dateKey = format(localDate, 'yyyy-MM-dd');

      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
    }

    // Build metrics array with all dates (including zeros)
    const metrics: DailyMetric[] = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');

      metrics.push({
        date: dateKey,
        count: dailyMap.get(dateKey) || 0,
        timezone,
      });

      currentDate = addDays(currentDate, 1);
    }

    return metrics;
  }
}
```

**File:** `apps/backend/src/metrics/use-cases/get-daily-metrics.spec.ts`

**File:** `apps/backend/src/metrics/use-cases/get-weekly-metrics.ts`
(Similar structure, with week aggregation logic)

**File:** `apps/backend/src/metrics/use-cases/get-weekly-metrics.spec.ts`

### Step 6: Create MetricsController

**File:** `apps/backend/src/metrics/adapters/metrics.controller.ts`

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DailyMetricsResponseDto, WeeklyMetricsResponseDto } from '@gsd/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/dto/jwt-user.dto';
import { GetDailyMetrics } from '../use-cases/get-daily-metrics';
import { GetWeeklyMetrics } from '../use-cases/get-weekly-metrics';
import { GetDailyMetricsQueryDto } from '../dto/get-daily-metrics-query.dto';
import { GetWeeklyMetricsQueryDto } from '../dto/get-weekly-metrics-query.dto';

@Controller('v1/metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(
    private readonly getDailyMetricsUseCase: GetDailyMetrics,
    private readonly getWeeklyMetricsUseCase: GetWeeklyMetrics,
  ) {}

  @Get('daily')
  async getDailyMetrics(
    @CurrentUser() user: JwtUser,
    @Query() query: GetDailyMetricsQueryDto,
  ): Promise<DailyMetricsResponseDto> {
    return this.getDailyMetricsUseCase.execute(user.id, query);
  }

  @Get('weekly')
  async getWeeklyMetrics(
    @CurrentUser() user: JwtUser,
    @Query() query: GetWeeklyMetricsQueryDto,
  ): Promise<WeeklyMetricsResponseDto> {
    return this.getWeeklyMetricsUseCase.execute(user.id, query);
  }
}
```

### Step 7: Create MetricsModule

**File:** `apps/backend/src/metrics/metrics.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MetricsController } from './adapters/metrics.controller';
import { GetDailyMetrics } from './use-cases/get-daily-metrics';
import { GetWeeklyMetrics } from './use-cases/get-weekly-metrics';
import { MetricsRepository } from './infra/metrics.repository';

@Module({
  controllers: [MetricsController],
  providers: [
    GetDailyMetrics,
    GetWeeklyMetrics,
    MetricsRepository,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [GetDailyMetrics, GetWeeklyMetrics],
})
export class MetricsModule {}
```

### Step 8: Register MetricsModule in AppModule

**File:** `apps/backend/src/app.module.ts`

```typescript
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    // ... existing modules
    MetricsModule,
  ],
})
export class AppModule {}
```

### Step 9: Write Tests

**Unit Tests:**

- GetDailyMetrics use case tests
  - ✅ Returns correct daily counts
  - ✅ Converts timezones correctly
  - ✅ Fills gaps with zero counts
  - ✅ Handles empty result set
  - ✅ Validates date range (throws for end < start)
  - ✅ Validates date range (throws for range > 1 year)

- GetWeeklyMetrics use case tests
  - ✅ Returns correct weekly counts (Monday-Sunday)
  - ✅ Converts timezones correctly
  - ✅ Handles partial weeks
  - ✅ Validates date range

**Integration Tests:**
**File:** `apps/backend/test/metrics.e2e-spec.ts`

E2E test scenarios:

- ✅ GET /v1/metrics/daily returns 200 with metrics array
- ✅ GET /v1/metrics/weekly returns 200 with metrics array
- ✅ Daily metrics use default date range (30 days)
- ✅ Weekly metrics use default date range (12 weeks)
- ✅ Daily metrics respect timezone parameter
- ✅ Weekly metrics respect timezone parameter
- ✅ Returns 401 without JWT
- ✅ Returns 400 for invalid date format
- ✅ Returns 400 for invalid timezone format
- ✅ Returns 400 for date range > 1 year

### Step 10: Swagger Documentation

Add to controller:

```typescript
@ApiOperation({ summary: 'Get daily task completion metrics' })
@ApiQuery({ name: 'startDate', required: false, example: '2025-11-01' })
@ApiQuery({ name: 'endDate', required: false, example: '2025-11-15' })
@ApiQuery({ name: 'timezone', required: false, example: 'America/New_York' })
@ApiResponse({ status: 200, description: 'Daily metrics retrieved successfully' })
```

### Step 11: Update Project Tracker

- Mark "Metrics & Analytics Module" as completed in `.ai/project-tracker.md`
- Update MetricsModule implementation status

## 11. Testing Strategy

### Unit Tests

**GetDailyMetrics:**

- ✅ Aggregates tasks by day correctly
- ✅ Converts UTC timestamps to user timezone
- ✅ Fills missing days with zero counts
- ✅ Handles empty task list
- ✅ Throws BadRequestException for invalid date range
- ✅ Uses default values when query params omitted

**GetWeeklyMetrics:**

- ✅ Aggregates tasks by week (Monday-Sunday)
- ✅ Handles partial weeks at start/end of range
- ✅ Converts timezones correctly
- ✅ Throws BadRequestException for invalid date range

**MetricsRepository:**

- ✅ Queries tasks within date range
- ✅ Filters by userId
- ✅ Orders by completedAt ascending

### Integration Tests

**HTTP Success:**

- ✅ GET /v1/metrics/daily returns 200 with correct structure
- ✅ GET /v1/metrics/weekly returns 200 with correct structure
- ✅ Defaults work correctly (30 days for daily, 12 weeks for weekly)
- ✅ Timezone conversion produces correct date grouping

**HTTP Errors:**

- ✅ Returns 400 for malformed dates
- ✅ Returns 400 for invalid timezone
- ✅ Returns 400 for end date < start date
- ✅ Returns 400 for date range > 1 year
- ✅ Returns 401 without JWT token

**Edge Cases:**

- ✅ User with no completed tasks returns empty metrics (all zeros)
- ✅ Tasks completed exactly at midnight (timezone boundary)
- ✅ Timezone conversion across DST boundaries

## 12. Open Questions & Decisions

### 1. Aggregation: Database vs. Application Layer

**Question:** Should aggregation be done in database (SQL GROUP BY) or application?

**Options:**

- A) Database: Use PostgreSQL `DATE_TRUNC` and `GROUP BY`
- B) Application: Fetch all tasks, group in-memory with date-fns

**MVP Decision:** Application layer (Option B)

- Simpler implementation (no timezone conversion in SQL)
- Easier to test and debug
- Performance acceptable for <1000 tasks per query
- Can optimize later with database-level aggregation if needed

**Post-MVP:** Consider database aggregation for better performance.

### 2. Caching Strategy

**Question:** Should metrics be cached?

**MVP Decision:** No caching in MVP

- Queries are fast enough (<100ms)
- Simple implementation
- No cache invalidation complexity

**Post-MVP:** Add caching for past dates (immutable) using Redis.

### 3. Frontend Timezone Detection

**Question:** How does frontend determine user's timezone?

**Frontend Responsibility:**

- Use `Intl.DateTimeFormat().resolvedOptions().timeZone` in browser
- Send as query parameter to API

**Alternative:** Store user timezone preference in User model (future enhancement).

### 4. Week Start Day Configuration

**Question:** Should week start day be configurable (Monday vs. Sunday)?

**MVP Decision:** Hard-code to Monday (ISO 8601 standard, per PRD).

**Post-MVP:** Add user preference for week start day.

### 5. Empty Metrics Display

**Question:** Should days/weeks with zero tasks be included in response?

**MVP Decision:** Yes, include all days/weeks with count=0.

- Easier for frontend to render (no gaps)
- Clearer for users to see patterns

**Alternative:** Only return non-zero counts (more compact response).

## 13. Related User Stories & Features

### User Stories

- **US-016**: Metrics display (this feature)

### Related Features

- **CompleteTask**: Sets completedAt timestamp (source of metrics data)
- **DoneModule**: Displays completed tasks (complementary view)
- **Tasks retention**: Done view retention (N=500) affects metrics accuracy for old data

### Success Metrics (PRD Section 6)

- **Primary KPI**: Tasks completed per user per week (target: 10+)
- **Secondary KPI**: Tasks completed per user per day
- **Leading indicator**: Ratio of tasks completed to tasks created

## 14. Performance Benchmarks

### Expected Query Performance

**Scenario:** User with 100 completed tasks in last 30 days

| Operation             | Time (ms) |
| --------------------- | --------- |
| Database query        | 5-10      |
| In-memory aggregation | 5-10      |
| DTO serialization     | 5         |
| **Total**             | **15-25** |

**Scenario:** User with 1000 completed tasks in last year (max range)

| Operation             | Time (ms) |
| --------------------- | --------- |
| Database query        | 20-30     |
| In-memory aggregation | 10-20     |
| DTO serialization     | 10        |
| **Total**             | **40-60** |

### Monitoring

- Log query execution time
- Track 95th percentile in production
- Alert if queries exceed 200ms

## 15. Future Enhancements (Post-MVP)

### Enhanced Metrics

- **Completion rate**: Tasks completed / tasks created
- **Streak tracking**: Consecutive days with completed tasks
- **Time-of-day analysis**: When are users most productive?
- **List-based metrics**: Which lists have highest completion rates?

### Visualizations

- **Charts**: Line chart for daily trends, bar chart for weekly
- **Heatmap**: Calendar heatmap showing completion density
- **Insights**: AI-generated productivity insights

### Export

- **CSV/JSON export**: Download metrics data
- **Integration**: Export to productivity tracking tools

### Comparative Metrics

- **Week-over-week**: Compare this week to last week
- **Goals**: Set completion goals, track progress

## 16. Rollout Plan

### Phase 1: Implementation (This Plan)

- Implement MetricsModule (repository, use cases, controller)
- Write comprehensive tests
- Deploy to production

### Phase 2: Frontend Integration

- Create metrics dashboard view
- Display daily/weekly charts
- Allow timezone and date range selection

### Phase 3: Monitoring & Iteration

- Monitor query performance
- Collect user feedback
- Consider caching if performance becomes an issue

### Phase 4: Enhancements (Post-MVP)

- Add streak tracking
- Add completion rate metrics
- Implement visualizations (charts, heatmaps)
