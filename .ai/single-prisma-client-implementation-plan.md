# Single Prisma Client Implementation Plan

## Problem Statement

Currently, each module in the backend creates its own PrismaClient instance, leading to:
- Multiple database connection pools (inefficient resource usage)
- Potential connection pool exhaustion
- Inconsistent lifecycle management
- Increased memory footprint

**Affected Modules:**
- ListsModule (creates new instance with `useValue`)
- TasksModule (creates new instance with `useValue`)
- AuthModule (creates new instance with `useValue`)
- MetricsModule (creates new instance with `useValue`)
- DoneModule (adds PrismaClient to providers)
- MaintenanceModule (adds PrismaClient to providers)
- ColorModule (adds PrismaClient to providers)
- HealthModule (adds PrismaClient to providers)

## Solution Overview

Create a dedicated `PrismaModule` that:
1. Provides a single shared PrismaClient instance
2. Implements proper lifecycle management (connect on init, disconnect on destroy)
3. Is globally available to all modules
4. Follows NestJS best practices for shared services

## Implementation Steps

### Step 1: Create PrismaModule

**Location:** `apps/backend/src/database/prisma.module.ts`

**Responsibilities:**
- Provide a single PrismaClient instance
- Handle database connection lifecycle (connect/disconnect)
- Export PrismaClient for use across all modules
- Make module global to avoid repeated imports

**Implementation Details:**
```typescript
import { Global, Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppLogger } from '../logger/app-logger';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => {
        const prisma = new PrismaClient({
          log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ],
        });
        return prisma;
      },
    },
    AppLogger,
  ],
  exports: [PrismaClient],
})
export class PrismaModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PrismaModule.name);
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.prisma.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Failed to disconnect from database', error.stack);
    }
  }
}
```

**Key Features:**
- `@Global()` decorator makes PrismaClient available everywhere without re-importing
- `useFactory` provides lazy instantiation
- Optional Prisma query logging configuration
- Proper connection lifecycle with error handling
- Logging for connection events

### Step 2: Import PrismaModule in AppModule

**Location:** `apps/backend/src/app.module.ts`

**Action:** Add PrismaModule to the imports array

**Before:**
```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot([...]),
    LoggerModule,
    AuthModule,
    ListsModule,
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

**After:**
```typescript
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [
    PrismaModule, // Add as first import for early initialization
    ThrottlerModule.forRoot([...]),
    LoggerModule,
    AuthModule,
    ListsModule,
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

### Step 3: Remove PrismaClient Providers from Individual Modules

Remove PrismaClient from providers in all affected modules since it's now globally available.

#### 3.1 Update ListsModule

**Location:** `apps/backend/src/lists/lists.module.ts`

**Before:**
```typescript
@Module({
  imports: [ColorModule],
  controllers: [ListsController],
  providers: [
    GetLists,
    CreateList,
    UpdateList,
    ToggleBacklog,
    ReorderList,
    DeleteList,
    ListsRepository,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [
    GetLists,
    CreateList,
    UpdateList,
    ToggleBacklog,
    ReorderList,
    DeleteList,
    ListsRepository,
  ],
})
export class ListsModule {}
```

**After:**
```typescript
@Module({
  imports: [ColorModule],
  controllers: [ListsController],
  providers: [
    GetLists,
    CreateList,
    UpdateList,
    ToggleBacklog,
    ReorderList,
    DeleteList,
    ListsRepository,
    // PrismaClient removed - now globally available via PrismaModule
  ],
  exports: [
    GetLists,
    CreateList,
    UpdateList,
    ToggleBacklog,
    ReorderList,
    DeleteList,
    ListsRepository,
  ],
})
export class ListsModule {}
```

**Also remove the import statement:**
```typescript
// Remove this line:
import { PrismaClient } from '@prisma/client';
```

#### 3.2 Update TasksModule

**Location:** `apps/backend/src/tasks/tasks.module.ts`

**Changes:**
- Remove `import { PrismaClient } from '@prisma/client';`
- Remove PrismaClient provider from providers array

**After:**
```typescript
@Module({
  imports: [ListsModule],
  controllers: [TasksController],
  providers: [
    CreateTask,
    GetTasks,
    UpdateTask,
    DeleteTask,
    MoveTask,
    CompleteTask,
    ReorderTask,
    TasksRepository,
    // PrismaClient removed
  ],
  exports: [
    CreateTask,
    GetTasks,
    UpdateTask,
    DeleteTask,
    MoveTask,
    CompleteTask,
    ReorderTask,
    TasksRepository,
  ],
})
export class TasksModule {}
```

#### 3.3 Update AuthModule

**Location:** `apps/backend/src/auth/auth.module.ts`

**Changes:**
- Remove `import { PrismaClient } from '@prisma/client';`
- Remove PrismaClient provider from providers array

**After:**
```typescript
@Module({
  imports: [
    PassportModule,
    ListsModule,
    ColorModule,
    JwtModule.register({
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return secret;
      })(),
      signOptions: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    GoogleStrategy,
    JwtStrategy,
    UsersRepository,
    AuthenticateUser,
    OnboardUser,
    GetMe,
    SignOut,
    JwtAuthGuard,
    // PrismaClient removed
  ],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
```

#### 3.4 Update MetricsModule

**Location:** `apps/backend/src/metrics/metrics.module.ts`

**Changes:**
- Remove `import { PrismaClient } from '@prisma/client';`
- Remove PrismaClient provider from providers array

**After:**
```typescript
@Module({
  controllers: [MetricsController],
  providers: [
    GetDailyMetrics,
    GetWeeklyMetrics,
    MetricsRepository,
    AppLogger,
    // PrismaClient removed
  ],
  exports: [GetDailyMetrics, GetWeeklyMetrics],
})
export class MetricsModule {}
```

#### 3.5 Update DoneModule

**Location:** `apps/backend/src/done/done.module.ts`

**Changes:**
- Remove `import { PrismaClient } from '@prisma/client';`
- Remove PrismaClient from providers array

**After:**
```typescript
@Module({
  controllers: [DoneController],
  providers: [
    GetDoneTasks,
    DoneRepository,
    AppLogger,
    // PrismaClient removed
  ],
  exports: [],
})
export class DoneModule {}
```

#### 3.6 Update MaintenanceModule

**Location:** `apps/backend/src/maintenance/maintenance.module.ts`

**Changes:**
- Remove `import { PrismaClient } from '@prisma/client';`
- Remove PrismaClient from providers array

**After:**
```typescript
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    RetentionJob,
    AppLogger,
    // PrismaClient removed
  ],
  exports: [],
})
export class MaintenanceModule {}
```

#### 3.7 Update ColorModule

**Location:** `apps/backend/src/colors/color.module.ts`

**Changes:**
- Remove `import { PrismaClient } from '@prisma/client';`
- Remove PrismaClient from providers array

**After:**
```typescript
@Module({
  providers: [
    ColorPool,
    ScanUsedColors,
    // PrismaClient removed
  ],
  exports: [ColorPool],
})
export class ColorModule {}
```

#### 3.8 Update HealthModule

**Location:** `apps/backend/src/health/health.module.ts`

**Changes:**
- Remove `import { PrismaClient } from '@prisma/client';`
- Remove PrismaClient from providers array

**After:**
```typescript
@Module({
  controllers: [HealthController],
  providers: [
    CheckLiveness,
    CheckReadiness,
    HealthRepository,
    AppLogger,
    // PrismaClient removed
  ],
  exports: [],
})
export class HealthModule {}
```

### Step 4: Verification

After implementation, verify that:

1. **Application Starts Successfully**
   ```bash
   cd apps/backend
   pnpm dev
   ```
   - Should see "Database connection established" log
   - No connection errors

2. **All Tests Pass**
   ```bash
   cd apps/backend
   pnpm test
   pnpm test:e2e
   ```
   - All unit tests should pass
   - All e2e tests should pass
   - Test database connections work correctly

3. **Linting and Type Checking**
   ```bash
   cd apps/backend
   pnpm lint
   pnpm typecheck
   ```
   - No lint errors
   - No type errors

4. **Build Succeeds**
   ```bash
   cd apps/backend
   pnpm build
   ```
   - Build completes without errors

5. **Manual API Testing**
   - Test authentication endpoints
   - Test list CRUD operations
   - Test task CRUD operations
   - Test metrics endpoints
   - Test done endpoints
   - Verify all database operations work correctly

### Step 5: Update Tests (If Needed)

If any tests directly instantiate PrismaClient or mock it at the module level, update them to:
- Mock PrismaClient at the provider level
- Use the same global PrismaClient instance pattern

**Example test update:**
```typescript
// Before (if exists)
TestingModule.createTestingModule({
  providers: [
    SomeService,
    { provide: PrismaClient, useValue: mockPrisma },
  ],
});

// After (no change needed - global module handles it)
TestingModule.createTestingModule({
  providers: [SomeService],
}).overrideProvider(PrismaClient).useValue(mockPrisma);
```

## Benefits

1. **Single Connection Pool:** One PrismaClient = one connection pool
2. **Resource Efficiency:** Reduced memory and connection overhead
3. **Proper Lifecycle:** Centralized connect/disconnect logic
4. **Consistency:** All modules use the same database client instance
5. **Maintainability:** Database configuration in one place
6. **Testing:** Easier to mock and test with a single provider
7. **Best Practices:** Follows NestJS recommended patterns for shared services

## Migration Checklist

- [ ] Create `apps/backend/src/database/prisma.module.ts`
- [ ] Import PrismaModule in AppModule
- [ ] Remove PrismaClient from ListsModule
- [ ] Remove PrismaClient from TasksModule
- [ ] Remove PrismaClient from AuthModule
- [ ] Remove PrismaClient from MetricsModule
- [ ] Remove PrismaClient from DoneModule
- [ ] Remove PrismaClient from MaintenanceModule
- [ ] Remove PrismaClient from ColorModule
- [ ] Remove PrismaClient from HealthModule
- [ ] Run linting
- [ ] Run type checking
- [ ] Run build
- [ ] Run all tests
- [ ] Manual API testing
- [ ] Update project tracker

## Rollback Plan

If issues arise:
1. Revert the PrismaModule creation
2. Restore PrismaClient providers in each module
3. Remove PrismaModule import from AppModule

## Notes

- This is a non-breaking refactoring (no API changes)
- All existing code that injects PrismaClient will continue to work
- No changes needed to repositories or use cases
- The `@Global()` decorator eliminates the need to import PrismaModule in every feature module
