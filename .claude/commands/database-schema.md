---
description: Design and review database schema changes for GSD
---

# Database Schema & Migration Assistant

Your task is to help design, review, and implement database schema changes for GSD.

## Context

Review the project structure:

1. **Core Domain Model:**
   @CLAUDE.md

2. **Database Configuration:**
   @CLAUDE.md

## Database Constraints

Current requirements:

- Engine: PostgreSQL 16
- Indexes: user_id, list_id, completed_at, order_index
- Transactions: Via Prisma $transaction
- Limits: 10 non-Done lists/user, 100 tasks/list, 500 completed tasks retained
- Storage: UTC timestamps, timezone applied in API layer

## Schema Review Checklist

### 1. Correctness

- [ ] All required fields present
- [ ] Data types appropriate
- [ ] Constraints properly defined
- [ ] Relationships correctly modeled
- [ ] Foreign keys with correct cascade behavior

### 2. Performance

- [ ] Indexes on: user_id, list_id, completed_at, order_index
- [ ] No N+1 queries expected
- [ ] Query patterns optimized
- [ ] Soft deletes vs hard deletes decision made

### 3. Data Integrity

- [ ] NOT NULL constraints where needed
- [ ] Unique constraints defined
- [ ] Foreign key constraints enforced
- [ ] Check constraints for business rules

### 4. Scalability

- [ ] Partition strategy if needed
- [ ] Archive strategy for old data (500 task retention)
- [ ] Index maintenance considerations

## Migration Strategy

For schema changes:

1. **Create migration**: `pnpm prisma migrate dev --name [description]`
2. **Review schema.prisma**: Verify changes are correct
3. **Test locally**: Run against local Postgres
4. **Document**: Explain migration purpose
5. **Verify**: Check data integrity

## Common Operations

### Adding a new column

```typescript
// In schema.prisma
model Task {
  // ... existing fields
  newField    String?  // @db.Varchar(255)
}
```

### Creating indexes

```typescript
// In schema.prisma
model Task {
  // ... fields
  @@index([userId])
  @@index([listId])
  @@index([completedAt])
}
```

### Retention & Cleanup

- Keep last 500 completed tasks per user
- Delete oldest first when limit exceeded
- Use maintenance cron jobs via @nestjs/schedule

## Output Format

Document schema changes as:

```markdown
# Database Migration: [Description]

## Purpose

[Why this change is needed]

## Current Schema

[Relevant current schema]

## Proposed Schema

[New schema with changes]

## Migration Steps

1. Add new field/table
2. Migrate existing data
3. Remove old field/table

## Performance Impact

[Indexes added, query improvements]

## Data Integrity

[How data consistency is maintained]

## Rollback Strategy

[How to revert if needed]
```

Save migration documentation to `.ai/migrations/[date]-[description].md`.
