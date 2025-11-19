# Feature Implementation Plan: Health Endpoints

## 1. Feature Overview

Health endpoints provide monitoring capabilities for the GSD application, enabling infrastructure to verify application status, readiness for traffic, and database connectivity. This is critical for orchestration platforms (Kubernetes, Docker Swarm) and monitoring systems.

Two endpoints will be implemented:

- **GET /health** (liveness): Basic application status check
- **GET /health/ready** (readiness): Application readiness including database connectivity

These endpoints are unauthenticated and follow standard health check patterns for cloud-native applications.

## 2. Inputs

### GET /health

- **Parameters:** None
- **Query Parameters:** None
- **Headers:** None (unauthenticated)
- **Request Body:** N/A

### GET /health/ready

- **Parameters:** None
- **Query Parameters:** None
- **Headers:** None (unauthenticated)
- **Request Body:** N/A

## 3. Used Types

### Response DTOs

```typescript
// @gsd/types/api/health.ts
export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: 'up' | 'down';
  };
}
```

### Backend DTOs

No request DTOs needed (no input validation required).

Response classes will directly implement the shared interfaces.

## 4. Outputs

### GET /health

**Success Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "uptime": 86400
}
```

**Status Codes:**

- `200 OK` - Application is running

### GET /health/ready

**Success Response (200 OK):**

```json
{
  "status": "ready",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "checks": {
    "database": "up"
  }
}
```

**Failure Response (503 Service Unavailable):**

```json
{
  "status": "not_ready",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "checks": {
    "database": "down"
  }
}
```

**Status Codes:**

- `200 OK` - Application is ready to serve traffic
- `503 Service Unavailable` - Application is not ready (database unreachable)

## 5. Data Flow

### Liveness Check (/health)

1. Controller receives GET request
2. CheckLiveness use case executes
3. Returns current timestamp and process uptime
4. Controller returns 200 OK with status

### Readiness Check (/health/ready)

1. Controller receives GET request
2. CheckReadiness use case executes
3. Use case calls HealthRepository to ping database
4. Repository executes `prisma.$queryRaw<[{ result: number }]>`SELECT 1 as result``
5. If query succeeds, database is "up"; if fails, database is "down"
6. Use case returns readiness status
7. Controller returns 200 OK (if ready) or 503 (if not ready)

## 6. Security Considerations

### Authentication

- **None required** - Health endpoints must be publicly accessible for monitoring
- No JWT guard applied to these endpoints
- No sensitive information exposed in responses

### Information Disclosure

- Do not expose:
  - Database connection strings
  - Internal service names or IPs
  - Stack traces or error details
  - Environment variables
- Only expose minimal status information

### Rate Limiting

- Apply lenient rate limiting (higher than standard endpoints)
- Monitoring systems may poll frequently
- Suggested: 300 requests/minute per IP

### DDoS Protection

- Health checks are lightweight (minimal DB queries)
- Database check uses simple `SELECT 1` query
- No complex computations or heavy operations

## 7. Error Handling

### Liveness Endpoint Errors

- **Scenario:** Process uptime calculation fails
- **Handling:** Return static values (uptime: 0)
- **Status Code:** 200 OK (endpoint should always return 200)
- **Logging:** Warn level

### Readiness Endpoint Errors

| Error Scenario              | Handling                                                       | Status Code | Logging                             |
| --------------------------- | -------------------------------------------------------------- | ----------- | ----------------------------------- |
| Database connection failure | Return `{ status: 'not_ready', checks: { database: 'down' } }` | 503         | Error level with connection details |
| Database timeout            | Return `{ status: 'not_ready', checks: { database: 'down' } }` | 503         | Error level with timeout            |
| Prisma query error          | Return `{ status: 'not_ready', checks: { database: 'down' } }` | 503         | Error level with error message      |
| Unexpected errors           | Return `{ status: 'not_ready', checks: { database: 'down' } }` | 503         | Error level with stack trace        |

**Error Response Consistency:**
All errors in readiness check result in 503 status with `not_ready` status, ensuring monitoring systems can treat any non-200 as "not ready".

## 8. Performance Considerations

### Liveness Check

- **Target:** <5ms response time (no I/O operations)
- **Optimization:** Use `process.uptime()` directly (no async operations)
- **Caching:** Not needed (stateless calculation)

### Readiness Check

- **Target:** <50ms response time (includes database ping)
- **Optimization:**
  - Use simplest possible database query (`SELECT 1`)
  - Set database query timeout to 5 seconds
  - No connection pooling overhead (reuse existing pool)
- **Caching:** Not recommended (defeats purpose of health check)

### Database Query

```sql
-- Minimal query with no table access
SELECT 1 as result
```

### Monitoring Impact

- Health checks executed frequently (every 5-30 seconds by orchestrators)
- Ensure minimal resource consumption
- No logging on success (only failures) to reduce log volume

## 9. Implementation Steps

### Step 1: Create shared types in @gsd/types

1. Create `packages/types/src/api/health.ts`
2. Define `HealthStatus` interface
3. Define `ReadinessStatus` interface
4. Export from `packages/types/src/api/index.ts`

### Step 2: Create HealthModule structure

1. Create `apps/backend/src/health/` directory
2. Create subdirectories: `adapters/`, `use-cases/`, `infra/`
3. Create `health.module.ts` with module definition

### Step 3: Implement HealthRepository

1. Create `apps/backend/src/health/infra/health.repository.ts`
2. Inject PrismaClient
3. Implement `pingDatabase()` method:
   - Execute `SELECT 1` query with timeout
   - Return boolean (true if successful, false otherwise)
   - Catch and log errors

### Step 4: Implement CheckLiveness use case

1. Create `apps/backend/src/health/use-cases/check-liveness.ts`
2. Inject AppLogger
3. Implement `execute()` method:
   - Get current timestamp (ISO 8601)
   - Get process uptime (seconds)
   - Return HealthStatus object
4. No error handling needed (always succeeds)

### Step 5: Implement CheckReadiness use case

1. Create `apps/backend/src/health/use-cases/check-readiness.ts`
2. Inject HealthRepository and AppLogger
3. Implement `execute()` method:
   - Call `healthRepository.pingDatabase()`
   - Build ReadinessStatus object based on result
   - Log errors if database is down
   - Return ReadinessStatus
4. Wrap in try-catch for unexpected errors

### Step 6: Create HealthController

1. Create `apps/backend/src/health/adapters/health.controller.ts`
2. Controller path: `/health`
3. Inject both use cases (CheckLiveness, CheckReadiness)
4. Implement `getLiveness()` endpoint:
   - Route: `GET /health`
   - Call `checkLivenessUseCase.execute()`
   - Return 200 with HealthStatus
5. Implement `getReadiness()` endpoint:
   - Route: `GET /health/ready`
   - Call `checkReadinessUseCase.execute()`
   - Return 200 if ready, 503 if not ready
   - Use `@HttpCode()` decorator for conditional status

### Step 7: Configure HealthModule

1. Update `apps/backend/src/health/health.module.ts`
2. Providers: HealthRepository, CheckLiveness, CheckReadiness, PrismaClient
3. Controllers: HealthController
4. No exports (module is self-contained)

### Step 8: Register HealthModule in AppModule

1. Import HealthModule in `apps/backend/src/app.module.ts`
2. Add to imports array

### Step 9: Configure rate limiting exception

1. Update rate limiting configuration (in main.ts or throttler config)
2. Exclude `/health` and `/health/ready` from strict rate limits
3. Apply lenient limits (300 req/min) if needed

### Step 10: Write unit tests

1. Create `check-liveness.spec.ts`:
   - Test successful liveness check
   - Test uptime calculation
   - Test timestamp format
2. Create `check-readiness.spec.ts`:
   - Test ready state (database up)
   - Test not ready state (database down)
   - Test error handling
3. Create `health.repository.spec.ts`:
   - Test successful database ping
   - Test database connection failure
   - Test database timeout

### Step 11: Write E2E tests

1. Create `apps/backend/test/health.e2e-spec.ts`
2. Test `GET /health`:
   - Verify 200 response
   - Verify response structure
   - Verify uptime is positive
3. Test `GET /health/ready`:
   - Verify 200 response when database is up
   - Verify response structure
   - Verify database check status

### Step 12: Update documentation

1. Update `.ai/project-tracker.md`:
   - Mark health endpoints as ✅
   - Update infrastructure progress percentage
2. Add health endpoints to API documentation (if using Swagger)
3. Document monitoring best practices in README

## 10. Testing Strategy

### Unit Tests (Target: 100% coverage)

- **check-liveness.spec.ts:** 3 test cases
- **check-readiness.spec.ts:** 4 test cases (ready, not ready, timeout, error)
- **health.repository.spec.ts:** 3 test cases

### E2E Tests

- **health.e2e-spec.ts:** 4 test cases
  - Liveness check returns 200
  - Liveness response has correct structure
  - Readiness check returns 200 when DB is up
  - Readiness check returns 503 when DB is down (simulate failure)

### Manual Testing

1. Start application
2. Verify `curl http://localhost:3000/health` returns 200
3. Verify `curl http://localhost:3000/health/ready` returns 200
4. Stop database
5. Verify `curl http://localhost:3000/health/ready` returns 503
6. Restart database
7. Verify readiness returns to 200

## 11. Monitoring Integration

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 5
  failureThreshold: 2
```

### Docker Compose Health Check

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/health/ready']
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s
```

---

## Notes

- Health endpoints are MVP-critical for production deployment
- Required for Docker and Kubernetes orchestration
- Should be implemented before Docker production image
- No authentication required (by design)
- Minimal logging to reduce noise in production
