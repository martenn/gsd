# Feature Implementation Plan: Rate Limiting

## 1. Feature Overview

Implement rate limiting for the GSD backend API to protect against abuse, brute-force attacks, and resource exhaustion. Rate limiting will:

- Prevent API abuse and DDoS attacks
- Protect authentication endpoints from credential stuffing
- Ensure fair resource allocation across users
- Maintain service availability under high load

Using `@nestjs/throttler` package, we'll implement:

- **Global rate limit:** 100 requests/minute per IP
- **Strict auth rate limit:** 5 requests/minute per IP for authentication endpoints
- **Lenient health check limit:** 300 requests/minute per IP for monitoring endpoints
- User-based rate limiting (optional future enhancement)

## 2. Inputs

Rate limiting operates on incoming HTTP requests and considers:

- **IP Address:** Primary identifier for rate limiting (from `req.ip`)
- **Endpoint:** Different limits for different route groups
- **User ID:** Optional user-based limiting (post-MVP)
- **Time Window:** Sliding window (1 minute)

### Request Metadata Used

- `req.ip` - Client IP address (considers X-Forwarded-For in production)
- `req.path` - Request path for route-specific limits
- `req.user.id` - Authenticated user ID (optional enhancement)

## 3. Used Types

### Throttler Configuration

```typescript
// apps/backend/src/config/throttler.config.ts
export interface ThrottlerConfig {
  ttl: number; // Time to live in seconds
  limit: number; // Max requests per TTL
}

export const THROTTLER_GLOBAL: ThrottlerConfig = {
  ttl: 60,
  limit: 100,
};

export const THROTTLER_AUTH: ThrottlerConfig = {
  ttl: 60,
  limit: 5,
};

export const THROTTLER_HEALTH: ThrottlerConfig = {
  ttl: 60,
  limit: 300,
};
```

### Response Headers

When rate limited, the following headers are included in all responses:

- `X-RateLimit-Limit` - Maximum requests allowed in window
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Time when the limit resets (Unix timestamp)
- `Retry-After` - Seconds to wait before retrying (on 429 response)

### Error Response (429 Too Many Requests)

```typescript
// Follows ErrorResponse from error-handling-middleware
{
  statusCode: 429,
  message: "Too many requests, please try again later",
  error: "Too Many Requests",
  timestamp: "2025-11-15T10:30:00.000Z",
  path: "/v1/lists",
  requestId: "req-abc123"
}
```

## 4. Outputs

### Success Response (Within Limits)

- **Status Code:** Determined by endpoint (200, 201, etc.)
- **Headers:**
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1731668400
  ```
- **Body:** Normal endpoint response

### Rate Limited Response (Exceeded Limits)

- **Status Code:** `429 Too Many Requests`
- **Headers:**
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1731668400
  Retry-After: 23
  ```
- **Body:**
  ```json
  {
    "statusCode": 429,
    "message": "Too many requests, please try again later",
    "error": "Too Many Requests",
    "timestamp": "2025-11-15T10:30:00.000Z",
    "path": "/v1/lists",
    "requestId": "req-abc123"
  }
  ```

## 5. Data Flow

### Request Rate Limiting Flow

1. Request enters application
2. ThrottlerGuard intercepts request (before controller)
3. Guard extracts client identifier (IP address)
4. Guard checks rate limit storage (in-memory or Redis)
5. Guard increments request counter for client
6. If counter exceeds limit:
   - Throw `ThrottlerException` (429)
   - Include rate limit headers
   - HttpExceptionFilter formats error response
7. If within limit:
   - Add rate limit headers to response
   - Continue to controller

### Storage Flow

- **In-memory storage (MVP):** ThrottlerStorageService keeps counters in memory
- **Redis storage (future):** Distributed rate limiting across multiple servers
- **TTL management:** Counters automatically expire after TTL window

## 6. Security Considerations

### IP Address Trust

- **Development:** Trust `req.ip` directly
- **Production behind proxy:** Trust `X-Forwarded-For` header (configure Express)
- **Proxy configuration:** Set `trust proxy` in Express to extract real client IP
- **Header spoofing:** Ensure proxy is configured to strip/set `X-Forwarded-For` correctly

### Bypass Prevention

- Rate limits enforced at application level (before authentication)
- Cannot be bypassed by authenticated users (unless explicitly allowed)
- Multiple IPs from same user still counted separately (prevents Sybil attack)

### DDoS Protection

- Rate limiting is first line of defense, not complete protection
- Consider additional layers:
  - Reverse proxy rate limiting (Nginx, Cloudflare)
  - Network-level DDoS protection
  - Web Application Firewall (WAF)

### Authentication Endpoint Protection

- Strict limits on auth endpoints prevent:
  - Credential stuffing attacks
  - Brute-force password attempts
  - OAuth callback abuse
- **5 requests/minute** allows legitimate retries but blocks automated attacks

### Limit Tuning

- Monitor rate limit hits in production
- Adjust limits based on:
  - Legitimate user patterns
  - False positive rate (legitimate users blocked)
  - Attack patterns observed

## 7. Error Handling

### Rate Limit Exceeded

- **Status Code:** 429 Too Many Requests
- **Client Action:** Wait for `Retry-After` seconds before retrying
- **Server Action:** Log rate limit violations at WARN level
- **User Experience:** Display friendly error message with retry guidance

### Storage Failures

| Error Scenario           | Handling                            | Impact           | Logging     |
| ------------------------ | ----------------------------------- | ---------------- | ----------- |
| In-memory storage full   | Fail open (allow request)           | Temporary bypass | Error level |
| Redis connection failure | Fall back to in-memory or fail open | Temporary bypass | Error level |
| Counter overflow         | Reset counter                       | Rare edge case   | Warn level  |

**Fail Open Strategy:** If rate limiting storage fails, allow requests through (prefer availability over strict limiting).

### Configuration Errors

- Invalid TTL or limit values: Log error, use default values
- Missing configuration: Use safe defaults (100 req/min)
- Startup validation: Verify configuration on application bootstrap

## 8. Performance Considerations

### In-Memory Storage Performance

- **Target:** <1ms overhead per request
- **Memory usage:** ~100 bytes per unique client IP
- **Scalability:** Suitable for single-server deployments or low traffic
- **Limitation:** Does not work across multiple server instances

### Redis Storage Performance (Future)

- **Target:** <5ms overhead per request (network latency)
- **Scalability:** Supports distributed deployments
- **Memory usage:** Centralized in Redis
- **Recommendation:** Use for production multi-server deployments

### Header Overhead

- Rate limit headers add ~150 bytes per response
- Negligible impact on response size

### Optimization Strategies

- Use in-memory storage for MVP (simpler, faster)
- Pre-calculate reset timestamps
- Batch counter increments if using external storage
- Consider Bloom filters for IP tracking (advanced optimization)

## 9. Implementation Steps

### Step 1: Install @nestjs/throttler package

1. Run: `pnpm add @nestjs/throttler --filter @gsd/backend`
2. Verify installation in `apps/backend/package.json`

### Step 2: Create throttler configuration

1. Create `apps/backend/src/config/throttler.config.ts`
2. Define configuration constants:
   - `THROTTLER_GLOBAL` (100 req/min)
   - `THROTTLER_AUTH` (5 req/min)
   - `THROTTLER_HEALTH` (300 req/min)
3. Export configuration objects

### Step 3: Configure ThrottlerModule in AppModule

1. Import `ThrottlerModule` in `apps/backend/src/app.module.ts`
2. Configure with `ThrottlerModule.forRoot()`:
   - Set default TTL: 60 seconds
   - Set default limit: 100 requests
   - Use in-memory storage (default)
3. Add to imports array

### Step 4: Create custom throttler guard (optional)

1. Create `apps/backend/src/common/guards/custom-throttler.guard.ts`
2. Extend `ThrottlerGuard` from `@nestjs/throttler`
3. Override `getTracker()` method to customize IP extraction:
   - Check `X-Forwarded-For` header
   - Fall back to `req.ip`
4. Override `generateKey()` for custom key generation (optional)

### Step 5: Apply global throttler guard

1. Update `apps/backend/src/main.ts`
2. Register global guard:
   ```typescript
   app.useGlobalGuards(new CustomThrottlerGuard());
   ```
3. Ensure guard runs before other guards (order matters)

### Step 6: Configure auth endpoints with strict limits

1. Update `apps/backend/src/auth/adapters/auth.controller.ts`
2. Use `@Throttle()` decorator on auth endpoints:
   ```typescript
   @Throttle({ ttl: 60, limit: 5 })
   @Post('google')
   initiateGoogleAuth() { ... }
   ```
3. Apply to all auth routes (callback, signout)

### Step 7: Configure health endpoints with lenient limits

1. Update `apps/backend/src/health/adapters/health.controller.ts`
2. Use `@Throttle()` decorator on health endpoints:
   ```typescript
   @Throttle({ ttl: 60, limit: 300 })
   @Get()
   getLiveness() { ... }
   ```
3. Apply to both liveness and readiness endpoints

### Step 8: Skip throttling for specific endpoints (if needed)

1. Use `@SkipThrottle()` decorator to bypass rate limiting
2. Apply selectively (e.g., internal health checks, webhooks)
3. Document why throttling is skipped

### Step 9: Configure Express for proxy trust (production)

1. Update `apps/backend/src/main.ts`
2. Add Express configuration:
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     app.set('trust proxy', 1); // Trust first proxy
   }
   ```
3. Ensures `X-Forwarded-For` is correctly parsed

### Step 10: Add rate limit headers to responses

1. ThrottlerGuard automatically adds headers:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`
2. Verify headers in responses (manual testing)

### Step 11: Customize ThrottlerException message

1. In custom guard, override `throwThrottlingException()`:
   ```typescript
   protected throwThrottlingException() {
     throw new ThrottlerException('Too many requests, please try again later');
   }
   ```
2. Ensures consistent error message

### Step 12: Write unit tests

1. Create `custom-throttler.guard.spec.ts`:
   - Test IP extraction from `X-Forwarded-For`
   - Test fallback to `req.ip`
   - Test key generation
2. Create configuration tests:
   - Test default configuration values
   - Test custom configuration override

### Step 13: Write E2E tests

1. Create `apps/backend/test/rate-limiting.e2e-spec.ts`
2. Test global rate limit:
   - Send 100 requests to `/v1/lists`
   - Verify 101st request returns 429
   - Verify rate limit headers
3. Test auth rate limit:
   - Send 5 requests to `/auth/google`
   - Verify 6th request returns 429
4. Test reset window:
   - Hit rate limit
   - Wait for TTL to expire
   - Verify requests allowed again
5. Test health endpoint lenient limit:
   - Send 300 requests to `/health`
   - Verify 301st request returns 429

### Step 14: Add monitoring and alerting

1. Log rate limit violations:
   - IP address
   - Endpoint
   - Timestamp
   - Rate exceeded by how much
2. Consider metrics:
   - Count of 429 responses per endpoint
   - Top rate-limited IPs
   - Rate limit hit rate percentage

### Step 15: Update documentation

1. Update `.ai/project-tracker.md`:
   - Mark rate limiting as ✅
   - Update infrastructure progress percentage
2. Document rate limits in API documentation
3. Add rate limiting guide to README:
   - Limits per endpoint
   - How to handle 429 responses
   - Retry strategies for clients

## 10. Testing Strategy

### Unit Tests (Target: 100% coverage)

- **custom-throttler.guard.spec.ts:** 6+ test cases
  - IP extraction from different headers
  - Key generation
  - Limit enforcement
  - Configuration override

### E2E Tests (Target: Key scenarios)

- **rate-limiting.e2e-spec.ts:** 8+ test cases
  - Global limit enforcement (100 req/min)
  - Auth endpoint strict limit (5 req/min)
  - Health endpoint lenient limit (300 req/min)
  - Rate limit headers present
  - Retry-After header on 429
  - Reset window behavior
  - Multiple IPs tracked independently
  - Authenticated vs unauthenticated rate limits

### Load Testing (Optional)

- Use `ab` (Apache Bench) or `wrk` to send high-volume requests
- Verify rate limiting holds under load
- Measure performance overhead

### Manual Testing

1. Send rapid requests to any endpoint: `for i in {1..120}; do curl http://localhost:3000/v1/lists; done`
2. Verify 429 response after 100 requests
3. Check rate limit headers in response
4. Wait 60 seconds and verify limit resets

## 11. Rate Limit Configuration Summary

| Endpoint Group   | TTL | Limit | Req/Min   | Purpose                    |
| ---------------- | --- | ----- | --------- | -------------------------- |
| Global (default) | 60s | 100   | 100       | General API protection     |
| Auth endpoints   | 60s | 5     | 5         | Prevent credential attacks |
| Health endpoints | 60s | 300   | 300       | Allow frequent monitoring  |
| Skip throttle    | N/A | N/A   | Unlimited | Internal/webhook endpoints |

## 12. Client Integration Guidance

### Handling 429 Responses

Frontend clients should:

1. Detect 429 status code
2. Read `Retry-After` header
3. Wait specified seconds before retrying
4. Display user-friendly message: "Too many requests, please wait X seconds"
5. Implement exponential backoff for retries

### Example Client Code (JavaScript)

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = (parseInt(retryAfter) || 60) * 1000;
      console.log(`Rate limited, waiting ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

### Best Practices for Clients

- Cache responses to reduce API calls
- Implement request debouncing
- Display rate limit headers to users (debugging)
- Batch operations when possible
- Respect `Retry-After` header (don't ignore)

## 13. Future Enhancements

### User-Based Rate Limiting

- Track limits per authenticated user ID (in addition to IP)
- Allows different limits for different user tiers
- Implementation: Custom throttler guard with user context

### Redis Storage

- Distributed rate limiting across multiple servers
- Required for horizontal scaling
- Configuration: `@nestjs/throttler` with Redis storage adapter

### Dynamic Rate Limits

- Adjust limits based on server load
- Lower limits during high traffic
- Implementation: Custom throttler with configurable limits

### Rate Limit Bypass for Trusted IPs

- Whitelist internal service IPs
- Skip rate limiting for admin tools
- Implementation: Check IP against whitelist in custom guard

---

## Notes

- Rate limiting is critical security infrastructure
- Must be implemented before public deployment
- Use in-memory storage for MVP (simpler, sufficient for single server)
- Plan Redis migration for production scaling
- Monitor 429 response rate to tune limits
- Balance security (strict limits) with usability (loose limits)
- Health check limits should be lenient for monitoring systems
- Auth endpoint limits should be strict for security
