# Prisma Migrations Guide

Quick reference for managing database schema changes in GSD using Prisma Migrate.

## Core Concept

**Prisma Migrate vs Flyway:**

- **Flyway**: Write SQL migrations manually → Apply them
- **Prisma**: Change `schema.prisma` → Generate SQL migrations → Apply them

**Single Source of Truth:** `apps/backend/prisma/schema.prisma`

## Essential Commands

### Development Workflow

```bash
# 1. Edit schema.prisma to add/modify models
# 2. Generate and apply migration:
pnpm prisma migrate dev --name descriptive_name

# This does 3 things:
# - Generates migration SQL in prisma/migrations/
# - Applies it to your dev database
# - Regenerates Prisma Client
```

### Production Deployment

```bash
# Apply pending migrations (CI/CD, staging, production):
pnpm prisma migrate deploy

# Check migration status:
pnpm prisma migrate status
```

### Other Useful Commands

```bash
# Reset database (dev only - drops DB, replays all migrations + seed):
pnpm prisma migrate reset

# Generate migration without applying (for review):
pnpm prisma migrate dev --create-only --name my_migration
# Then edit the SQL manually if needed, then apply:
pnpm prisma migrate dev

# View database in GUI:
pnpm prisma studio
```

## Migration File Structure

```
apps/backend/prisma/
├── schema.prisma           # Source of truth
├── migrations/
│   ├── 20231028120000_init/
│   │   └── migration.sql   # CREATE TABLE statements
│   ├── 20231028150000_add_task_priority/
│   │   └── migration.sql   # ALTER TABLE statements
│   └── migration_lock.toml
└── seed.ts
```

Each migration is a timestamped folder containing SQL DDL statements.

## Example: Adding a Field

**Step 1:** Edit `schema.prisma`

```prisma
model Task {
  id          String    @id @default(uuid())
  title       String
  priority    Int       @default(0)  // NEW FIELD
  // ... rest
}
```

**Step 2:** Generate migration

```bash
pnpm prisma migrate dev --name add_task_priority
```

**Step 3:** Prisma auto-generates SQL

```sql
-- prisma/migrations/20231028150000_add_task_priority/migration.sql
ALTER TABLE "tasks" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
```

**Step 4:** Migration applied + Prisma Client updated automatically

## Important: migrate dev vs db push

```bash
# ✅ USE IN PRODUCTION PROJECTS (creates versioned migrations):
pnpm prisma migrate dev

# ⚠️ PROTOTYPE ONLY (no migration files, direct schema sync):
pnpm prisma db push
```

**Current GSD scripts in `package.json`:**

- `db:migrate` → Uses `migrate dev` ✅ Correct for production
- `db:push` → Available but avoid for production features

## Best Practices

1. **Always use `migrate dev`** during development (not `db push`)
2. **Review generated SQL** before committing migrations
3. **Never edit applied migrations** - create new ones to fix issues
4. **Commit migrations to git** - they're part of your codebase
5. **Use `migrate deploy` in CI/CD** - never run `migrate dev` in production
6. **Test migrations on staging first**
7. **Add descriptive names** to migrations: `add_task_priority` not `update1`

## Initializing Migrations

If starting fresh or converting from prototype mode:

```bash
cd apps/backend
pnpm prisma migrate dev --name init
```

This creates the baseline migration from your current `schema.prisma`.

## Migration History Table

Prisma tracks applied migrations in a special table: `_prisma_migrations`

This is similar to Flyway's `flyway_schema_history` table.

## Troubleshooting

**Migration conflicts:**

```bash
# Mark a migration as applied (if already applied manually):
pnpm prisma migrate resolve --applied "20231028150000_migration_name"

# Mark as rolled back:
pnpm prisma migrate resolve --rolled-back "20231028150000_migration_name"
```

**Reset everything (dev only):**

```bash
pnpm prisma migrate reset  # Nuclear option - drops DB and replays all migrations
```

## CI/CD Integration Example

```yaml
# .github/workflows/deploy.yml
- name: Run database migrations
  run: |
    cd apps/backend
    pnpm prisma migrate deploy
```

## Reference

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- Current schema: `apps/backend/prisma/schema.prisma`
- Migrations folder: `apps/backend/prisma/migrations/`
