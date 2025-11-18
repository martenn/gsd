# Maintenance Module Implementation Plan

## 1. Feature Overview

The Maintenance module provides automated background jobs for system maintenance tasks. For MVP, the primary task is retention management: keeping only the last 500 completed tasks per user and automatically deleting older completed tasks.

**Implementation:** Simple cron job using @nestjs/schedule

**Key behaviors:**

- Runs daily at a scheduled time (e.g., 2 AM UTC)
- Deletes completed tasks beyond the 500-task limit per user
- Logs execution for monitoring
- Handles errors gracefully without affecting application

## 2. Inputs

**Scheduled Job Parameters:**

- None (runs automatically via cron)

**Business Logic Parameters:**

- Retention limit: 500 tasks per user (hardcoded for MVP)
- Query: Find users with > 500 completed tasks
- Delete: Remove oldest completed tasks beyond limit

## 3. Used Types

**No new shared types needed** - Internal implementation only

**Prisma Operations:**

```typescript
// Find users with > 500 completed tasks
prisma.task.groupBy({
  by: ['userId'],
  where: { completedAt: { not: null } },
  _count: { id: true },
  having: { id: { _count: { gt: 500 } } }
})

// Delete oldest completed tasks for user
prisma.task.deleteMany({
  where: {
    userId: string,
    completedAt: { not: null },
    id: { notIn: [keep these 500 task IDs] }
  }
})
```

## 4. Data Flow

1. **Cron Scheduler** triggers job at scheduled time (daily 2 AM UTC)
2. **RetentionJob Service** (`execute()` method)
   - Log job start
   - Query all users with > 500 completed tasks
   - For each user:
     - Find 500 most recent completed tasks (ORDER BY completedAt DESC)
     - Delete all other completed tasks for that user
     - Log deletion count
   - Log job completion with summary
3. **Error Handling**: Catch and log errors, don't crash application

## 5. Security Considerations

- **No external input**: Job runs automatically, no API endpoint
- **Data safety**: Only deletes completed tasks (completedAt IS NOT NULL)
- **Idempotent**: Safe to run multiple times
- **User isolation**: Processes each user independently

## 6. Error Handling

| Scenario        | Status Code | Response                                     |
| --------------- | ----------- | -------------------------------------------- |
| Success         | N/A         | Log summary (users processed, tasks deleted) |
| Database error  | N/A         | Log error, continue to next user             |
| Partial failure | N/A         | Log which users failed, complete rest        |

**Logging strategy:**

- Log job start with timestamp
- Log each user processed with deletion count
- Log errors with user context
- Log job completion with totals

## 7. Performance Considerations

- **Query optimization**: Use indexed columns (userId, completedAt)
- **Batch processing**: Process users one at a time to avoid memory issues
- **Transaction safety**: Use transaction per user to ensure consistency
- **Scheduled timing**: Run during off-peak hours (2 AM UTC)
- **Monitoring**: Log execution time for performance tracking

## 8. Implementation Steps

### Phase 1: Setup (Steps 1-3)

1. **Install @nestjs/schedule**
   - Add dependency to backend package.json
   - Import ScheduleModule in app.module.ts

2. **Create MaintenanceModule structure**
   - Create `apps/backend/src/maintenance/` directory
   - Create `maintenance.module.ts` with MaintenanceModule
   - Create `jobs/` subdirectory for scheduled tasks
   - Add MaintenanceModule to app.module.ts imports

3. **Create RetentionJob service**
   - Create `apps/backend/src/maintenance/jobs/retention.job.ts`
   - Inject PrismaClient and AppLogger
   - Implement basic structure with @Cron decorator

### Phase 2: Business Logic (Steps 4-6)

4. **Implement retention query logic**
   - Method to find users with > 500 completed tasks
   - Method to get 500 most recent task IDs for a user
   - Use Prisma groupBy and orderBy operations

5. **Implement deletion logic**
   - Method to delete old completed tasks for a user
   - Use Prisma transaction for safety
   - Return count of deleted tasks

6. **Implement main execute method**
   - Orchestrate: find users → process each → log results
   - Error handling per user (don't fail entire job)
   - Summary logging with totals

### Phase 3: Testing & Monitoring (Steps 7-8)

7. **Write unit tests**
   - Test retention logic with mock data
   - Test edge cases (exactly 500, < 500, > 500)
   - Test error handling
   - Mock PrismaClient and AppLogger

8. **Add monitoring and documentation**
   - Document cron schedule in module
   - Add health check consideration
   - Test manual job trigger (for debugging)

---

**Notes:**

- Cron schedule: `'0 2 * * *'` (2 AM UTC daily)
- Retention limit: 500 tasks per user (hardcoded constant)
- No API endpoint needed (internal job only)
- Safe to run multiple times (idempotent)
- Consider future: configurable retention limit per user
