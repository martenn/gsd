# Feature Implementation Plan: Error Handling Middleware

## 1. Feature Overview

Implement a global exception filter and error handling middleware for the GSD NestJS backend to provide:

- Consistent error response format across all endpoints
- Proper HTTP status codes for different error types
- Security-conscious error messages (no stack traces in production)
- Structured logging of all errors
- Integration with NestJS exception hierarchy

This centralizes error handling, eliminating inconsistent error responses and improving client error handling, debugging, and monitoring.

## 2. Inputs

Error handling middleware intercepts all exceptions thrown by:

- Controllers (validation errors, business logic errors)
- Guards (authentication/authorization failures)
- Interceptors (transformation errors)
- Pipes (validation errors)
- Use cases (business logic exceptions)

### Exception Types to Handle

| Exception Type                  | Source                         | Example                                  |
| ------------------------------- | ------------------------------ | ---------------------------------------- |
| `BadRequestException`           | DTO validation, business rules | Invalid input, limits exceeded           |
| `UnauthorizedException`         | Auth guard                     | Missing or invalid JWT                   |
| `ForbiddenException`            | Authorization guard            | Insufficient permissions                 |
| `NotFoundException`             | Use cases                      | List/task not found                      |
| `ConflictException`             | Business logic                 | Duplicate resource                       |
| `HttpException`                 | Custom business errors         | Any HTTP error                           |
| `Error` (unhandled)             | Application errors             | Unexpected failures                      |
| `PrismaClientKnownRequestError` | Database errors                | Constraint violations, connection errors |

## 3. Used Types

### Shared Types (@gsd/types)

```typescript
// @gsd/types/api/error.ts
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  constraints: string[];
}
```

### Backend Classes

```typescript
// apps/backend/src/common/filters/http-exception.filter.ts
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void;
}

// apps/backend/src/common/exceptions/business.exception.ts
export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus);
}
```

## 4. Outputs

### Standard Error Response (400, 404, 409, etc.)

```json
{
  "statusCode": 404,
  "message": "List not found",
  "error": "Not Found",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/lists/abc123",
  "requestId": "req-xyz789"
}
```

### Validation Error Response (400)

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/lists",
  "requestId": "req-xyz789",
  "errors": [
    {
      "field": "name",
      "constraints": ["name must be shorter than or equal to 100 characters"]
    }
  ]
}
```

### Internal Server Error (500)

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/tasks",
  "requestId": "req-xyz789"
}
```

**Note:** Stack traces and detailed error information are logged but NOT included in production responses.

## 5. Data Flow

### Exception Handling Flow

1. Exception thrown anywhere in application (controller, guard, use case, etc.)
2. NestJS exception layer catches exception
3. HttpExceptionFilter receives exception
4. Filter determines exception type:
   - Known HTTP exception → Extract status code and message
   - Prisma error → Map to appropriate HTTP status
   - Unhandled error → Map to 500 Internal Server Error
5. Filter constructs ErrorResponse object
6. Filter logs error with AppLogger (includes stack trace)
7. Filter sends formatted JSON response to client
8. Client receives consistent error format

### Request ID Flow

1. Request enters application
2. RequestIdMiddleware generates UUID for request
3. UUID stored in request object and async context
4. UUID included in all logs for the request
5. UUID included in error response for correlation

## 6. Security Considerations

### Information Disclosure Prevention

- **Production:** Never expose stack traces, internal paths, or database details
- **Development:** Include additional debug information
- **Environment detection:** Use `NODE_ENV` to determine response verbosity

### Secure Error Messages

- Generic messages for 500 errors: "Internal server error"
- Specific messages for 4xx errors (client errors are safe to expose)
- Never expose:
  - Database schema details
  - Internal service names
  - File paths or code locations
  - Environment variables
  - Sensitive data in validation errors

### Example Secure vs Insecure Messages

| ❌ Insecure                                            | ✅ Secure                 |
| ------------------------------------------------------ | ------------------------- |
| "Cannot connect to postgres at localhost:5432"         | "Internal server error"   |
| "Prisma query failed: User table constraint violation" | "Resource already exists" |
| "JWT secret is invalid"                                | "Unauthorized"            |
| "/usr/src/app/dist/lists/use-cases/create-list.js:42"  | (path only in logs)       |

### Authentication Error Handling

- 401 Unauthorized: Invalid or missing JWT
- 403 Forbidden: Valid user but insufficient permissions
- Never reveal if user exists or not (prevent enumeration)

## 7. Error Handling

The error handler itself must be robust and never fail. If the error handler encounters an error:

1. Catch any errors in filter execution
2. Log the filter error
3. Return minimal safe response: `{ statusCode: 500, message: "Internal server error" }`
4. Never let filter errors propagate (would crash the application)

### Prisma Error Mapping

| Prisma Error Code | HTTP Status               | Message                           |
| ----------------- | ------------------------- | --------------------------------- |
| P2002             | 409 Conflict              | "Resource already exists"         |
| P2025             | 404 Not Found             | "Resource not found"              |
| P2003             | 400 Bad Request           | "Invalid reference"               |
| P2023             | 400 Bad Request           | "Invalid input"                   |
| P1001, P1002      | 503 Service Unavailable   | "Service temporarily unavailable" |
| Other             | 500 Internal Server Error | "Internal server error"           |

## 8. Performance Considerations

### Minimal Overhead

- Filter executes only on error path (not on success)
- Error responses are lightweight (small JSON objects)
- Logging is async (non-blocking)
- No external API calls in error handling

### Target Performance

- **Error response time:** <10ms additional overhead
- **Logging overhead:** <5ms
- **Total error handling time:** <20ms

### Optimization Strategies

- Pre-compile error response templates
- Use object pooling for common error responses (optional)
- Batch logs if error rate is extremely high (future optimization)

## 9. Implementation Steps

### Step 1: Create shared error types

1. Create `packages/types/src/api/error.ts`
2. Define `ErrorResponse` interface
3. Define `ValidationErrorResponse` interface
4. Define `ValidationError` interface
5. Export from `packages/types/src/api/index.ts`

### Step 2: Create common directory structure

1. Create `apps/backend/src/common/` directory
2. Create subdirectories:
   - `common/filters/` (exception filters)
   - `common/exceptions/` (custom exceptions)
   - `common/middleware/` (request ID middleware)
   - `common/interceptors/` (if needed)

### Step 3: Implement RequestIdMiddleware

1. Create `apps/backend/src/common/middleware/request-id.middleware.ts`
2. Generate UUID for each request
3. Store in request object: `req.id = uuid()`
4. Optionally use AsyncLocalStorage for context (advanced)

### Step 4: Create custom exception classes

1. Create `apps/backend/src/common/exceptions/business.exception.ts`
2. Extend `HttpException`
3. Add constructor accepting message and status code
4. Used for domain-specific errors (e.g., "Last backlog cannot be deleted")

### Step 5: Implement HttpExceptionFilter

1. Create `apps/backend/src/common/filters/http-exception.filter.ts`
2. Implement `ExceptionFilter` interface
3. Inject `AppLogger`
4. Implement `catch(exception, host)` method:
   - Extract HTTP context from `host`
   - Determine exception type (HttpException, Prisma, Error)
   - Map to HTTP status code
   - Build ErrorResponse object
   - Include request ID from request
   - Log error with full context (status, message, stack, user, path)
   - Send JSON response with appropriate status code

### Step 6: Add Prisma error handling

1. In HttpExceptionFilter, detect `PrismaClientKnownRequestError`
2. Create `mapPrismaErrorToHttp()` helper method:
   - Switch on error.code (P2002, P2025, etc.)
   - Return appropriate HTTP status and message
3. Integrate into main catch logic

### Step 7: Add environment-aware error details

1. Detect `NODE_ENV` in filter
2. If development:
   - Include stack trace in response (optional field)
   - Include more detailed error messages
3. If production:
   - Generic error messages
   - No stack traces
   - Minimal information disclosure

### Step 8: Register middleware and filter globally

1. Update `apps/backend/src/main.ts`:
   - Apply RequestIdMiddleware globally: `app.use(new RequestIdMiddleware().use)`
   - Register HttpExceptionFilter globally: `app.useGlobalFilters(new HttpExceptionFilter(logger))`
2. Ensure filter is registered AFTER other middleware

### Step 9: Update existing use cases to throw appropriate exceptions

1. Audit all use cases for error handling
2. Replace generic errors with specific HTTP exceptions:
   - `throw new NotFoundException('List not found')`
   - `throw new BadRequestException('Cannot create task in Done list')`
   - `throw new BusinessException('Last backlog cannot be deleted', HttpStatus.CONFLICT)`
3. Ensure all business rule violations throw proper exceptions

### Step 10: Write unit tests

1. Create `http-exception.filter.spec.ts`:
   - Test NotFoundException → 404 response
   - Test BadRequestException → 400 response
   - Test validation errors → 400 with errors array
   - Test UnauthorizedException → 401 response
   - Test Prisma P2002 → 409 Conflict
   - Test Prisma P2025 → 404 Not Found
   - Test generic Error → 500 response
   - Test environment-specific responses (dev vs prod)
   - Test request ID inclusion
   - Test logging behavior

### Step 11: Write E2E tests

1. Create `apps/backend/test/error-handling.e2e-spec.ts`
2. Test error responses from actual endpoints:
   - Invalid DTO → 400 with validation errors
   - Non-existent resource → 404
   - Unauthorized access → 401
   - Business rule violation → 409 or 400
   - Server error simulation → 500

### Step 12: Update documentation

1. Update `.ai/project-tracker.md`:
   - Mark error handling middleware as ✅
   - Update infrastructure progress percentage
2. Document error response format in API documentation
3. Add error handling guide to backend README

## 10. Testing Strategy

### Unit Tests (Target: 100% coverage)

- **http-exception.filter.spec.ts:** 12+ test cases
  - All exception types
  - Prisma error mapping
  - Environment-specific behavior
  - Request ID inclusion
  - Logging verification

### E2E Tests (Target: Key scenarios)

- **error-handling.e2e-spec.ts:** 6+ test cases
  - Validation error from DTO
  - Not found error from use case
  - Unauthorized error from auth guard
  - Business logic error (conflict)
  - Database constraint violation
  - Unexpected server error

### Manual Testing

1. Send invalid DTO to POST /v1/lists
2. Request non-existent list GET /v1/lists/invalid-id
3. Send request without JWT to protected endpoint
4. Violate business rule (e.g., delete last backlog)
5. Simulate database error
6. Verify consistent error format in all cases

## 11. Error Response Examples by Status Code

### 400 Bad Request (Validation)

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/lists",
  "requestId": "req-abc123",
  "errors": [
    {
      "field": "name",
      "constraints": ["name should not be empty", "name must be a string"]
    }
  ]
}
```

### 400 Bad Request (Business Rule)

```json
{
  "statusCode": 400,
  "message": "Cannot create task in Done list",
  "error": "Bad Request",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/tasks",
  "requestId": "req-abc124"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/lists",
  "requestId": "req-abc125"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "List not found",
  "error": "Not Found",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/lists/invalid-id",
  "requestId": "req-abc126"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Last backlog cannot be deleted",
  "error": "Conflict",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/lists/backlog-id",
  "requestId": "req-abc127"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "path": "/v1/tasks",
  "requestId": "req-abc128"
}
```

---

## Notes

- Error handling middleware is foundational infrastructure
- Should be implemented early (before extensive API development)
- Improves debugging, monitoring, and client integration
- Consistent error format enables better frontend error handling
- Request ID correlation is critical for production troubleshooting
- Consider integrating with error monitoring services (Sentry, Datadog) in future
