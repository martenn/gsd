# API Endpoint Implementation Plan: Authentication Made with Google

## 1. Feature Overview

Implement Google OAuth 2.0 authentication for the GSD application, enabling users to sign in with their Google accounts. The authentication flow will:

1. Initiate Google OAuth flow when users request sign-in
2. Handle Google OAuth callback and create/retrieve user account
3. Issue a JWT token stored in an HttpOnly cookie for session management
4. Provide endpoints to retrieve current user info and sign out
5. Protect all existing API endpoints with authentication guards
6. Replace hardcoded `'mock-user-id'` with authenticated user context

**User Stories (from PRD):**

- US-017: Google sign-in/out - Users can sign in with Google OAuth and sign out when finished
- US-018: Data isolation - API enforces per-user data scoping; cross-user access attempts are denied

**Architecture:**

- Follow clean architecture pattern: adapters (controllers) → use-cases → repositories
- Use NestJS Passport with Google OAuth strategy
- JWT strategy for session validation
- Global authentication guard for protected routes

---

## 2. Input Details

### 2.1 Google OAuth Initiation

**Endpoint**: `GET /auth/google`

**Parameters:**

- None required
- Optional query parameters handled by Passport strategy

**Request Body:**

- None

**Notes:**

- Redirects user to Google OAuth consent screen
- Passport handles OAuth state parameter generation

---

### 2.2 Google OAuth Callback

**Endpoint**: `GET /auth/google/callback`

**Parameters:**

- `code` (query): OAuth authorization code from Google (automatically handled)
- `state` (query): CSRF protection state parameter (automatically handled)
- `error` (query, optional): Error code if OAuth fails
- `error_description` (query, optional): Error description if OAuth fails

**Request Body:**

- None

**Validation:**

- Google callback parameters validated by Passport strategy
- State parameter verified for CSRF protection

---

### 2.3 Sign Out

**Endpoint**: `POST /auth/signout`

**Parameters:**

- None

**Request Body:**

- None

**Validation:**

- Requires authenticated user (valid JWT cookie)

---

### 2.4 Get Current User

**Endpoint**: `GET /auth/me`

**Parameters:**

- None

**Request Body:**

- None

**Validation:**

- Requires authenticated user (valid JWT cookie)

---

## 3. Used Types

### 3.1 Shared Types (in `@gsd/types/api/auth.ts`)

```typescript
// Request interfaces (minimal for auth - mostly handled by OAuth flow)
// No explicit request DTOs needed for OAuth endpoints

// Response DTOs
export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMeResponseDto {
  user: UserDto;
}

export interface SignInResponseDto {
  message: string;
  user: UserDto;
}

export interface SignOutResponseDto {
  message: string;
}
```

### 3.2 Backend DTOs (in `apps/backend/src/auth/dto/`)

**No request DTOs needed** - OAuth endpoints handled by Passport strategies

**Internal DTOs:**

- JWT payload interface (for token signing/verification)
- Google profile interface (from Passport)

```typescript
// apps/backend/src/auth/dto/jwt-payload.dto.ts
export interface JwtPayload {
  sub: string; // userId
  email: string;
}

// Google profile from passport-google-oauth20
export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified?: boolean }>;
  displayName?: string;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  photos?: Array<{ value: string }>;
}
```

### 3.3 Prisma Models (already exist)

```typescript
// User model (from schema.prisma)
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  googleId  String   @unique @map("google_id")
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  lists List[]
  tasks Task[]
}
```

---

## 4. Output Details

### 4.1 Sign In Flow Response

**`GET /auth/google/callback`** - On successful authentication:

- **HTTP 302 Redirect** to frontend application
- **HttpOnly Cookie Set**: `jwt` cookie containing JWT token
- Cookie attributes:
  - `HttpOnly: true` (prevents JavaScript access)
  - `Secure: true` (HTTPS only in production)
  - `SameSite: Lax` (CSRF protection)
  - `Max-Age: 7 days` (or configurable)
- Redirect URL: `{FRONTEND_URL}/auth/callback?success=true`

**On OAuth error:**

- **HTTP 302 Redirect** to frontend: `{FRONTEND_URL}/auth/callback?error={error_code}`
- Status codes from Google:
  - `access_denied`: User denied consent
  - `invalid_request`: Malformed request
  - `server_error`: Google server error

---

### 4.2 Get Current User Response

**`GET /auth/me`** - **200 OK**:

```typescript
{
  user: {
    id: "uuid",
    email: "user@example.com",
    name: "John Doe" | null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**401 Unauthorized** (if no valid JWT):

```typescript
{
  statusCode: 401,
  message: "Unauthorized",
  error: "Unauthorized"
}
```

---

### 4.3 Sign Out Response

**`POST /auth/signout`** - **200 OK**:

```typescript
{
  message: 'Signed out successfully';
}
```

- **HttpOnly Cookie Cleared**: `jwt` cookie removed

**401 Unauthorized** (if no valid JWT):

```typescript
{
  statusCode: 401,
  message: "Unauthorized",
  error: "Unauthorized"
}
```

---

## 5. Data Flow

### 5.1 Google OAuth Sign-In Flow

```
1. User clicks "Sign in with Google" on frontend
   ↓
2. Frontend redirects to: GET /auth/google
   ↓
3. AuthController.googleAuth() → GoogleStrategy.authenticate()
   ↓
4. Passport redirects to Google OAuth consent screen
   ↓
5. User grants/denies permission on Google
   ↓
6a. Success: Google redirects to GET /auth/google/callback?code=xxx&state=yyy
   ↓
7a. GoogleStrategy.validate() receives profile:
      - googleId: profile.id
      - email: profile.emails[0].value
      - name: profile.displayName || profile.name
   ↓
8a. AuthenticateUser use case:
      - Check if user exists by googleId
      - If exists: return existing user
      - If not: create new user with googleId, email, name
   ↓
9a. JWT issued:
      - Payload: { sub: user.id, email: user.email }
      - Signed with JWT_SECRET
      - Stored in HttpOnly cookie named 'jwt'
   ↓
10a. Redirect to frontend: {FRONTEND_URL}/auth/callback?success=true
   ↓
6b. Failure: Google redirects with error parameters
   ↓
7b. Error handling:
      - Log error details
      - Redirect to: {FRONTEND_URL}/auth/callback?error={code}
```

### 5.2 Protected Route Flow

```
1. User makes request to protected endpoint (e.g., GET /v1/lists)
   ↓
2. JwtAuthGuard intercepts request
   ↓
3. JwtStrategy.validate() extracts JWT from cookie
   ↓
4. Verify JWT signature and expiration
   ↓
5a. Valid JWT:
      - Decode payload: { sub: userId, email }
      - Attach user to request: req.user = { id: userId, email }
      - Allow request to proceed
   ↓
5b. Invalid/missing JWT:
      - Return 401 Unauthorized
      - Request blocked
   ↓
6. Controller extracts userId from req.user.id
   ↓
7. Use case executes with userId (replaces 'mock-user-id')
```

### 5.3 Get Current User Flow

```
1. User requests GET /auth/me (with JWT cookie)
   ↓
2. JwtAuthGuard validates JWT
   ↓
3. GetMe use case:
      - Extract userId from req.user.id
      - Query UsersRepository.findById(userId)
   ↓
4. Return UserDto (200 OK)
```

### 5.4 Sign Out Flow

```
1. User requests POST /auth/signout (with JWT cookie)
   ↓
2. JwtAuthGuard validates JWT
   ↓
3. SignOut use case:
      - Clear JWT cookie (set Max-Age: 0)
   ↓
4. Return success message (200 OK)
```

---

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Google OAuth 2.0:**

- Use official Google OAuth 2.0 flow with state parameter for CSRF protection
- Validate redirect URIs match configured allowed origins
- Verify OAuth token signature from Google
- Store `googleId` as unique identifier (prevent duplicate accounts)

**JWT Token Security:**

- Store JWT in HttpOnly cookie (prevents XSS attacks)
- Use strong secret key (`JWT_SECRET`) with sufficient entropy (min 32 chars)
- Set appropriate expiration (recommended: 7 days)
- Use `SameSite: Lax` cookie attribute (CSRF protection)
- Use `Secure: true` in production (HTTPS only)
- Sign tokens with HS256 algorithm

**Session Management:**

- JWT contains minimal data: `{ sub: userId, email }`
- No sensitive data in JWT payload
- Validate JWT on every protected request
- Clear cookie on sign-out

### 6.2 Data Isolation

**User Data Scoping:**

- All repository queries must filter by `userId`
- Verify user ownership before any operation (database-level filtering)
- Never expose user data from other users
- Guards enforce authentication before data access

**Authorization Checks:**

- JWT guard validates token before controller execution
- Use cases receive `userId` from authenticated context
- Repositories always include `where: { userId }` in queries

### 6.3 Injection & Validation

**OAuth Flow:**

- Passport handles OAuth parameter validation
- State parameter prevents CSRF attacks
- Google profile data sanitized before database insertion

**User Input:**

- Email format validated (Google provides verified emails)
- Name field sanitized (trim, max length 255)
- Google ID validated as string

### 6.4 Error Handling Security

**Information Disclosure:**

- Generic error messages for authentication failures
- Don't reveal if email exists in system during OAuth callback
- Log detailed errors server-side only

**Rate Limiting:**

- Apply throttling to `/auth/google` endpoint to prevent abuse
- Limit OAuth callback attempts
- Protect against brute force on JWT validation

### 6.5 Environment Configuration

**Required Environment Variables:**

```bash
# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=<strong random secret, min 32 chars>
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:4321
```

**Security Notes:**

- Never commit secrets to version control
- Use different OAuth credentials per environment (dev/staging/prod)
- Rotate `JWT_SECRET` periodically
- Use strong secrets (consider `openssl rand -hex 32`)

### 6.6 Local Development Setup

**Yes, Google OAuth can be tested locally!** Here's how to set it up:

**1. Create Google Cloud Project & OAuth Credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing one)
3. Enable **Google+ API** or **Google Identity Services** (depending on your project type)
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID**
6. Application type: **Web application**
7. Name: `GSD Local Development` (or your preferred name)
8. **Authorized JavaScript origins:**
   - `http://localhost:3000` (backend)
   - `http://localhost:4321` (frontend, if needed)
9. **Authorized redirect URIs:**
   - `http://localhost:3000/auth/google/callback` (MUST match `GOOGLE_CALLBACK_URL`)

**2. Configure Local Environment:**

Add to `apps/backend/.env`:

```bash
# Database (already exists)
DATABASE_URL=postgresql://gsd:gsd_dev_password@localhost:5432/gsd_dev

# Google OAuth - from Google Cloud Console
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT - generate with: openssl rand -hex 32
JWT_SECRET=your-strong-secret-minimum-32-characters
JWT_EXPIRES_IN=7d

# Frontend URL for redirects
FRONTEND_URL=http://localhost:4321
```

**3. Test OAuth Flow Locally:**

1. Start backend: `pnpm dev:backend` (runs on `http://localhost:3000`)
2. Start frontend: `pnpm dev:frontend` (runs on `http://localhost:4321`)
3. Navigate to: `http://localhost:4321` (or wherever your frontend login page is)
4. Click "Sign in with Google"
5. Frontend redirects to: `http://localhost:3000/auth/google`
6. Backend redirects to Google OAuth consent screen
7. User grants permission
8. Google redirects to: `http://localhost:3000/auth/google/callback`
9. Backend processes callback, sets JWT cookie, redirects to: `http://localhost:4321/auth/callback?success=true`
10. Frontend receives JWT cookie (HttpOnly), user is authenticated

**Important Notes for Local Testing:**

- ✅ **localhost URLs work perfectly** - Google allows `http://localhost` for OAuth redirects
- ✅ **HTTP is fine for local dev** - Use HTTPS in production only
- ✅ **Multiple local ports allowed** - You can register both `3000` and `4321` as authorized origins
- ✅ **No special tools needed** - Just need Google Cloud Console access
- ⚠️ **Redirect URI must match exactly** - `GOOGLE_CALLBACK_URL` must exactly match what's configured in Google Cloud Console
- ⚠️ **Credentials are sensitive** - Don't commit `.env` file (already in `.gitignore`)

**Troubleshooting Local OAuth:**

| Error                   | Cause                                     | Solution                                                                      |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `redirect_uri_mismatch` | Callback URL doesn't match Google Console | Verify `GOOGLE_CALLBACK_URL` matches exactly (including protocol, port, path) |
| `invalid_client`        | Wrong client ID or secret                 | Double-check credentials from Google Cloud Console                            |
| `access_denied`         | User denied consent                       | This is expected user behavior, not an error                                  |
| Cookie not set          | CORS or cookie settings                   | Verify `credentials: true` in CORS config and cookie `sameSite` settings      |

**Alternative: Test User Accounts:**

- Use your personal Google account for testing
- Google allows testing with your own account immediately
- No verification needed for local development
- Production OAuth apps may require Google verification (after MVP)

---

## 7. Error Handling

### 7.1 Authentication Errors

| Scenario              | Status Code | Message                             | Action                            |
| --------------------- | ----------- | ----------------------------------- | --------------------------------- |
| Missing JWT cookie    | 401         | "Unauthorized"                      | Redirect to sign-in               |
| Invalid JWT signature | 401         | "Unauthorized"                      | Clear cookie, redirect to sign-in |
| Expired JWT token     | 401         | "Unauthorized"                      | Redirect to sign-in               |
| OAuth access denied   | 302         | Redirect with `error=access_denied` | Show message to user              |
| OAuth server error    | 302         | Redirect with `error=server_error`  | Log error, show generic message   |
| Invalid OAuth state   | 400         | "Invalid state parameter"           | Log CSRF attempt                  |
| User creation fails   | 500         | "Failed to create account"          | Log error, redirect with error    |

### 7.2 Database Errors

| Scenario                         | Status Code | Message                           | Action                            |
| -------------------------------- | ----------- | --------------------------------- | --------------------------------- |
| Duplicate googleId               | 409         | "Account already exists"          | Return existing user (login)      |
| Duplicate email (race condition) | 409         | "Account already exists"          | Return existing user (login)      |
| Database connection failure      | 500         | "Service temporarily unavailable" | Log error, retry or show message  |
| User not found (on /auth/me)     | 404         | "User not found"                  | Clear cookie, redirect to sign-in |

### 7.3 Validation Errors

| Scenario                               | Status Code | Message                      | Action                         |
| -------------------------------------- | ----------- | ---------------------------- | ------------------------------ |
| Missing Google profile data            | 400         | "Invalid Google profile"     | Log error, redirect with error |
| Invalid email format                   | 400         | "Invalid email address"      | Log error, reject sign-in      |
| Missing required environment variables | 500         | "Server configuration error" | Log error, prevent startup     |

### 7.4 Error Response Format

**JSON Error Response:**

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;
}
```

**OAuth Callback Error (Redirect):**

- Query parameters: `?error={error_code}&error_description={description}`
- Frontend handles display

---

## 8. Performance Considerations

### 8.1 OAuth Flow Performance

**Optimizations:**

- Cache Google OAuth configuration (endpoints, public keys) if applicable
- Minimize redirect chain (direct callback to frontend)
- Use async/await consistently (no blocking operations)

**Expected Performance:**

- OAuth initiation: < 50ms (redirect generation)
- OAuth callback processing: < 200ms (user lookup/creation + JWT issuance)
- JWT validation: < 10ms (symmetric signing - HS256 is fast)

### 8.2 Database Queries

**User Lookup Optimization:**

- Index on `googleId` (unique index already exists)
- Index on `email` (unique index already exists)
- Use `findUnique` for O(1) lookups

**Query Patterns:**

```typescript
// OAuth callback - check if user exists
await prisma.user.findUnique({ where: { googleId } });

// Create user if not exists (upsert pattern)
await prisma.user.upsert({
  where: { googleId },
  create: { googleId, email, name },
  update: { email, name }, // Update if exists (shouldn't happen)
});

// Get current user
await prisma.user.findUnique({ where: { id: userId } });
```

### 8.3 JWT Validation Performance

**Guard Performance:**

- JWT validation happens on every protected request
- Use efficient JWT library (`@nestjs/jwt` uses `jsonwebtoken`)
- Cache decoded payload during request lifecycle (no re-decoding)
- HS256 is symmetric and fast (no network calls)

**Expected Overhead:**

- JWT validation: ~5-10ms per request
- Acceptable for MVP (< 100ms target for list operations)

### 8.4 Session Storage

**Stateless Sessions:**

- JWT in cookie (no server-side session storage)
- No Redis/database lookups for session validation
- Scales horizontally without sticky sessions
- Trade-off: Cannot revoke tokens before expiration (acceptable for MVP)

---

## 9. Implementation Steps

### Step 1: Install Required Dependencies

Install NestJS authentication packages and Passport strategies:

```bash
cd apps/backend
pnpm add @nestjs/passport @nestjs/jwt passport passport-google-oauth20 passport-jwt
pnpm add -D @types/passport-google-oauth20 @types/passport-jwt
pnpm add cookie-parser
pnpm add -D @types/cookie-parser
```

**Dependencies:**

- `@nestjs/passport`: NestJS Passport integration
- `@nestjs/jwt`: JWT module for NestJS
- `passport`: Passport authentication middleware
- `passport-google-oauth20`: Google OAuth 2.0 strategy
- `passport-jwt`: JWT strategy for token validation
- `cookie-parser`: Parse HTTP-only cookies

---

### Step 2: Create Auth Module Structure

Create the auth module following clean architecture:

```
apps/backend/src/auth/
├── adapters/
│   └── auth.controller.ts       # HTTP endpoints
├── use-cases/
│   ├── authenticate-user.ts     # Create/find user from Google profile
│   ├── authenticate-user.spec.ts
│   ├── get-me.ts                # Get current user
│   ├── get-me.spec.ts
│   ├── sign-out.ts              # Sign out (clear cookie)
│   └── sign-out.spec.ts
├── infra/
│   ├── users.repository.ts      # User database operations
│   └── strategies/
│       ├── google.strategy.ts   # Google OAuth Passport strategy
│       └── jwt.strategy.ts      # JWT validation Passport strategy
├── guards/
│   ├── jwt-auth.guard.ts        # Protect routes with JWT
│   └── jwt-auth.guard.spec.ts
├── decorators/
│   └── current-user.decorator.ts # Extract user from request
└── auth.module.ts               # NestJS module configuration
```

---

### Step 3: Create Users Repository

**File**: `apps/backend/src/auth/infra/users.repository.ts`

**Responsibilities:**

- Find user by `googleId`
- Find user by `id`
- Create new user
- Upsert user (create or update)

**Methods:**

- `findByGoogleId(googleId: string): Promise<User | null>`
- `findById(id: string): Promise<User | null>`
- `create(data: { googleId, email, name? }): Promise<User>`
- `upsertByGoogleId(data: { googleId, email, name? }): Promise<User>`

**Implementation Notes:**

- Use Prisma `findUnique` for indexed lookups
- Use `upsert` for OAuth callback (handle race conditions)
- Return Prisma User entity (not DTO)

---

### Step 4: Create Authenticate User Use Case

**File**: `apps/backend/src/auth/use-cases/authenticate-user.ts`

**Responsibilities:**

- Receive Google profile from OAuth callback
- Check if user exists by `googleId`
- Create user if not exists (first sign-in)
- Return User entity for JWT issuance

**Input:**

- Google profile: `{ id, emails, displayName }`

**Output:**

- User entity (Prisma User model)

**Business Logic:**

- Extract `googleId` from `profile.id`
- Extract `email` from `profile.emails[0].value` (verified)
- Extract `name` from `profile.displayName` or construct from `profile.name`
- Use `upsert` to handle concurrent sign-ins gracefully
- If user exists, update email/name if changed (Google profile may change)

---

### Step 5: Create Google OAuth Strategy

**File**: `apps/backend/src/auth/infra/strategies/google.strategy.ts`

**Responsibilities:**

- Configure Google OAuth 2.0 strategy
- Validate OAuth callback
- Transform Google profile to internal format
- Call AuthenticateUser use case

**Configuration:**

- `clientID`: from `GOOGLE_CLIENT_ID` env var
- `clientSecret`: from `GOOGLE_CLIENT_SECRET` env var
- `callbackURL`: from `GOOGLE_CALLBACK_URL` env var
- `scope`: `['profile', 'email']`

**Validate Method:**

- Extract `googleId`, `email`, `name` from profile
- Call `AuthenticateUser.execute(profile)`
- Return user entity (attached to request)

**Error Handling:**

- Catch and log OAuth errors
- Throw `UnauthorizedException` on validation failure

---

### Step 6: Create JWT Strategy

**File**: `apps/backend/src/auth/infra/strategies/jwt.strategy.ts`

**Responsibilities:**

- Extract JWT from HttpOnly cookie
- Validate JWT signature and expiration
- Return user payload for request context

**Configuration:**

- `secretOrKey`: from `JWT_SECRET` env var
- `jwtFromRequest`: custom extractor from cookie

**Cookie Extractor:**

```typescript
const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.jwt ?? null;
};
```

**Validate Method:**

- Receive JWT payload: `{ sub: userId, email }`
- Optionally verify user still exists in database (optional for MVP)
- Return `{ id: payload.sub, email: payload.email }` (attached to `req.user`)

---

### Step 7: Create JWT Auth Guard

**File**: `apps/backend/src/auth/guards/jwt-auth.guard.ts`

**Responsibilities:**

- Protect routes requiring authentication
- Use JWT strategy for validation
- Throw `UnauthorizedException` if no valid JWT

**Implementation:**

- Extend `AuthGuard('jwt')` from `@nestjs/passport`
- Can be applied per route or globally (except auth endpoints)

---

### Step 8: Create Current User Decorator

**File**: `apps/backend/src/auth/decorators/current-user.decorator.ts`

**Responsibilities:**

- Extract user from request object
- Type-safe access to authenticated user

**Usage:**

```typescript
@Get()
async getMe(@CurrentUser() user: { id: string; email: string }) {
  // user.id, user.email available
}
```

**Implementation:**

- Use `createParamDecorator` to extract `req.user`

---

### Step 9: Create Get Me Use Case

**File**: `apps/backend/src/auth/use-cases/get-me.ts`

**Responsibilities:**

- Fetch current user by ID
- Transform to UserDto

**Input:**

- `userId: string` (from authenticated context)

**Output:**

- `UserDto` (shared type from `@gsd/types`)

**Business Logic:**

- Query `UsersRepository.findById(userId)`
- Throw `NotFoundException` if user not found (edge case)
- Map Prisma User to UserDto

---

### Step 10: Create Sign Out Use Case

**File**: `apps/backend/src/auth/use-cases/sign-out.ts`

**Responsibilities:**

- Clear JWT cookie
- Return success message

**Input:**

- `response: Response` (Express response object for cookie manipulation)

**Output:**

- Success message

**Implementation:**

- Clear cookie: `response.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'lax' })`
- Return `{ message: 'Signed out successfully' }`

**Note:** Use case receives Response object (controller dependency injection)

---

### Step 11: Create Auth Controller

**File**: `apps/backend/src/auth/adapters/auth.controller.ts`

**Endpoints:**

1. **`GET /auth/google`**
   - Initiate Google OAuth
   - Use `@UseGuards(AuthGuard('google'))` decorator
   - Passport handles redirect

2. **`GET /auth/google/callback`**
   - OAuth callback handler
   - Use `@UseGuards(AuthGuard('google'))` decorator
   - On success:
     - Generate JWT token
     - Set HttpOnly cookie
     - Redirect to frontend success URL
   - On error:
     - Redirect to frontend error URL

3. **`GET /auth/me`**
   - Get current user
   - Use `@UseGuards(JwtAuthGuard)` decorator
   - Use `@CurrentUser()` decorator to get user
   - Call `GetMe.execute(userId)`
   - Return `UserDto`

4. **`POST /auth/signout`**
   - Sign out
   - Use `@UseGuards(JwtAuthGuard)` decorator
   - Call `SignOut.execute(response)`
   - Return success message

**JWT Token Generation:**

- Use `@nestjs/jwt` JwtService
- Sign payload: `{ sub: user.id, email: user.email }`
- Set cookie: `response.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })`

---

### Step 12: Configure Auth Module

**File**: `apps/backend/src/auth/auth.module.ts`

**Imports:**

- `PassportModule` (register both 'google' and 'jwt' strategies)
- `JwtModule` (configure with secret and expiresIn)
- `LoggerModule` (for logging)

**Providers:**

- `GoogleStrategy`
- `JwtStrategy`
- `UsersRepository`
- `AuthenticateUser`
- `GetMe`
- `SignOut`
- `JwtService` (from JwtModule)

**Exports:**

- `JwtAuthGuard` (for use in other modules)
- `JwtModule` (for JWT service usage in controller)

**JWT Module Configuration:**

```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
});
```

---

### Step 13: Configure Cookie Parser in Main

**File**: `apps/backend/src/main.ts`

**Add:**

```typescript
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  // ... existing code
  app.use(cookieParser());
  // ... rest of bootstrap
}
```

---

### Step 14: Register Auth Module in App Module

**File**: `apps/backend/src/app.module.ts`

**Add:**

```typescript
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    LoggerModule,
    AuthModule,  // Add here
    ListsModule,
    TasksModule,
  ],
  // ... rest
})
```

---

### Step 15: Update Controllers to Use Authenticated User

**Files to Update:**

- `apps/backend/src/lists/adapters/lists.controller.ts`
- `apps/backend/src/tasks/adapters/tasks.controller.ts`

**Changes:**

1. Import `JwtAuthGuard` and `CurrentUser` decorator
2. Add `@UseGuards(JwtAuthGuard)` to all endpoints
3. Replace `const userId = 'mock-user-id'` with `@CurrentUser() user` parameter
4. Use `user.id` instead of hardcoded string

**Example:**

```typescript
@Get()
@UseGuards(JwtAuthGuard)
async getLists(@CurrentUser() user: { id: string; email: string }): Promise<GetListsResponseDto> {
  const lists = await this.getListsUseCase.execute(user.id);
  return { lists };
}
```

---

### Step 16: Add Shared Types to @gsd/types Package

**File**: `packages/types/src/api/auth.ts` (new file)

**Add:**

```typescript
export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMeResponseDto {
  user: UserDto;
}

export interface SignInResponseDto {
  message: string;
  user: UserDto;
}

export interface SignOutResponseDto {
  message: string;
}
```

**Update**: `packages/types/src/index.ts` to export auth types

---

### Step 17: Create Environment Configuration

**File**: `apps/backend/.env.example` (update or create)

**Add:**

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your-strong-secret-min-32-chars
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:4321
```

**Documentation:**

- **See Section 6.6 "Local Development Setup"** for detailed Google Cloud Console setup instructions
- Generate strong JWT secret: `openssl rand -hex 32`
- **Important for local testing:** The `GOOGLE_CALLBACK_URL` must exactly match the redirect URI configured in Google Cloud Console
- Copy `.env.example` to `.env` and fill in your credentials

---

### Step 18: Add Swagger/OpenAPI Documentation

**File**: `apps/backend/openapi.yaml` (update)

**Add auth endpoints:**

- `GET /auth/google` - Initiate OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/signout` - Sign out

**Security Scheme:**

- Update security scheme to use cookie-based auth
- Add `cookieAuth` security scheme

---

### Step 19: Write Unit Tests

**Test Files:**

- `apps/backend/src/auth/use-cases/authenticate-user.spec.ts`
- `apps/backend/src/auth/use-cases/get-me.spec.ts`
- `apps/backend/src/auth/use-cases/sign-out.spec.ts`
- `apps/backend/src/auth/guards/jwt-auth.guard.spec.ts`
- `apps/backend/src/auth/infra/users.repository.spec.ts` (optional)

**Test Coverage:**

- AuthenticateUser: new user creation, existing user retrieval
- GetMe: user found, user not found
- SignOut: cookie clearing
- Guards: valid JWT, invalid JWT, missing JWT

---

### Step 20: Write E2E Tests

**File**: `apps/backend/test/auth.e2e-spec.ts` (new file)

**Test Scenarios:**

1. Google OAuth flow (mocked Google responses)
2. Get current user with valid JWT
3. Get current user without JWT (401)
4. Sign out with valid JWT
5. Sign out without JWT (401)
6. Protected endpoints require authentication

**Mocking:**

- Mock Google OAuth responses
- Use test JWT tokens for authenticated requests
- Test cookie handling

---

### Step 21: Update Lists and Tasks Modules

**Files**: Module files may need to import `JwtAuthGuard` if used globally

**Note**: Per-route guards in controllers is preferred (flexibility)

---

### Step 22: Documentation and Error Logging

**Add:**

- Log OAuth errors with context
- Log JWT validation failures
- Document OAuth setup process (Google Cloud Console)
- Update README with authentication flow

---

## 10. Frontend Integration

### 10.1 Overview

The frontend needs to integrate with the Google OAuth flow and manage authentication state. This integration should be **minimal but extensible** to support future features. Current frontend uses:

- **Astro** with React 19 islands
- Direct `fetch` calls (no API client wrapper yet)
- No auth state management yet
- Simple component structure

**Integration Requirements:**

1. **API Client** - Handle authenticated requests with cookies
2. **Auth State** - Simple state management for current user
3. **Auth Callback Page** - Handle OAuth redirects
4. **Login/Sign Out UI** - Basic auth buttons
5. **Protected Routes** - Basic route protection (extensible)

---

### 10.2 API Client Setup

**File**: `apps/frontend/src/lib/api-client.ts` (new file)

**Purpose:** Centralized API client that handles cookies and base URL

**Implementation:**

```typescript
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Essential for HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        message: 'Request failed',
      }));
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

**Environment Variable:**

Add to `.env` or `.env.local`:

```
PUBLIC_API_URL=http://localhost:3000
```

**Note:** `PUBLIC_` prefix makes env var available in Astro client code.

---

### 10.3 Auth State Management

**File**: `apps/frontend/src/lib/auth-context.tsx` (new file)

**Purpose:** Simple React context for auth state (extensible for TanStack Query later)

**Implementation:**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiClient.get<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (error) {
      // User not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signIn = () => {
    // Redirect to backend OAuth initiation
    window.location.href = `${import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/auth/google`;
  };

  const signOut = async () => {
    try {
      await apiClient.post('/auth/signout');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      // Redirect to home/login
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Usage:** Wrap app root with `<AuthProvider>` (see below)

**Note:** This is a simple implementation. Future: replace with TanStack Query for better caching and server state management.

---

### 10.4 Auth Callback Page

**File**: `apps/frontend/src/pages/auth/callback.astro` (new file)

**Purpose:** Handle OAuth callback redirects from backend

**Implementation:**

```astro
---
import AuthCallback from '../../components/AuthCallback';
import '../../styles/global.css';
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<meta name="viewport" content="width=device-width" />
		<title>GSD - Authenticating...</title>
	</head>
	<body class="p-8 bg-gray-50">
		<AuthCallback client:load />
	</body>
</html>
```

**File**: `apps/frontend/src/components/AuthCallback.tsx` (new file)

**Purpose:** React component to handle callback result

**Implementation:**

```typescript
import { useEffect } from 'react';
import { useAuth } from '../lib/auth-context';

export default function AuthCallback() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'true') {
      // Auth successful, refresh user and redirect
      refreshUser().then(() => {
        window.location.href = '/';
      });
    } else if (error) {
      // Auth failed, show error and redirect to login
      console.error('Authentication error:', error);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  }, [refreshUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}
```

---

### 10.5 Login Component

**File**: `apps/frontend/src/components/LoginButton.tsx` (new file)

**Purpose:** Google sign-in button

**Implementation:**

```typescript
import { useAuth } from '../lib/auth-context';

export default function LoginButton() {
  const { signIn } = useAuth();

  return (
    <button
      onClick={signIn}
      className="px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-3"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>Sign in with Google</span>
    </button>
  );
}
```

**Alternative:** Use a Google-branded button from their design guidelines or a library like `react-google-button`.

---

### 10.6 User Menu Component

**File**: `apps/frontend/src/components/UserMenu.tsx` (new file)

**Purpose:** Show user info and sign out button

**Implementation:**

```typescript
import { useAuth } from '../lib/auth-context';

export default function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <button
        onClick={signOut}
        className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Sign Out
      </button>
    </div>
  );
}
```

---

### 10.7 Protected Route Component

**File**: `apps/frontend/src/components/ProtectedRoute.tsx` (new file)

**Purpose:** Simple route protection (extensible for proper routing later)

**Implementation:**

```typescript
import { ReactNode } from 'react';
import { useAuth } from '../lib/auth-context';
import LoginButton from './LoginButton';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-6">GSD - Getting Shit Done</h1>
          <p className="text-gray-600 mb-8">Please sign in to continue</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

**Note:** This is basic protection. Future: integrate with Astro routing or React Router for proper route guards.

---

### 10.8 Update Main Layout

**File**: `apps/frontend/src/pages/index.astro`

**Update to include auth:**

```astro
---
import { AuthProvider } from '../lib/auth-context';
import ProtectedRoute from '../components/ProtectedRoute';
import UserMenu from '../components/UserMenu';
import Counter from '../components/Counter';
import CounterBackend from '../components/CounterBackend';
import '../styles/global.css';
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
		<title>GSD - Getting Shit Done</title>
	</head>
	<body class="p-8 bg-gray-50">
		<AuthProvider client:only="react">
			<ProtectedRoute client:only="react">
				<div class="mb-6 flex justify-between items-center">
					<h1 class="text-3xl font-bold">GSD - Getting Shit Done</h1>
					<UserMenu client:only="react" />
				</div>
				<p class="mb-4 text-gray-600">Monorepo setup complete with React 19 + Tailwind CSS</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
					<Counter client:load />
					<CounterBackend client:load />
				</div>
			</ProtectedRoute>
		</AuthProvider>
	</body>
</html>
```

**Note:** Astro's `client:only="react"` forces client-side rendering for React context providers.

**Alternative Approach:** Create a React app shell component that wraps everything:

**File**: `apps/frontend/src/components/AppShell.tsx`

```typescript
import { AuthProvider } from '../lib/auth-context';
import ProtectedRoute from './ProtectedRoute';
import UserMenu from './UserMenu';
import Counter from './Counter';
import CounterBackend from './CounterBackend';

export default function AppShell() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="p-8 bg-gray-50">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">GSD - Getting Shit Done</h1>
            <UserMenu />
          </div>
          <p className="mb-4 text-gray-600">
            Monorepo setup complete with React 19 + Tailwind CSS
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            <Counter />
            <CounterBackend />
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
```

Then use in `index.astro`:

```astro
---
import AppShell from '../components/AppShell';
import '../styles/global.css';
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<meta name="viewport" content="width=device-width" />
		<title>GSD - Getting Shit Done</title>
	</head>
	<body>
		<AppShell client:only="react" />
	</body>
</html>
```

---

### 10.9 Update Backend API Calls

**Files to Update:**

- `apps/frontend/src/components/CounterBackend.tsx`

**Update to use API client:**

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

export default function CounterBackend() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ count: number }>('/counter')
      .then((data) => setCount(data.count))
      .catch((err) => {
        console.error('Error fetching counter:', err);
        // Handle 401 - redirect to login
        if (err.statusCode === 401) {
          window.location.href = '/';
        }
      });
  }, []);

  const handleIncrement = async () => {
    setLoading(true);
    try {
      const data = await apiClient.post<{ count: number }>('/counter/increment');
      setCount(data.count);
    } catch (err) {
      console.error('Error incrementing counter:', err);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

---

### 10.10 Environment Configuration

**File**: `apps/frontend/.env` or `.env.local`

**Add:**

```bash
PUBLIC_API_URL=http://localhost:3000
```

**Note:** Astro only exposes env vars prefixed with `PUBLIC_` to client-side code.

---

### 10.11 Future Extensibility Considerations

**Current Implementation (MVP):**

- ✅ Basic auth state with React Context
- ✅ Simple API client with cookie support
- ✅ OAuth callback handling
- ✅ Login/sign out UI

**Future Enhancements (Post-MVP):**

1. **TanStack Query Integration:**
   - Replace `AuthContext` state with TanStack Query
   - Better caching, refetching, and error handling
   - Example: `useQuery({ queryKey: ['user'], queryFn: () => apiClient.get('/auth/me') })`

2. **Proper Routing:**
   - Astro file-based routing with middleware
   - Or React Router for client-side routing
   - Protected route guards at route level

3. **Error Handling:**
   - Global error boundary
   - Toast notifications for errors
   - Retry logic for failed requests

4. **Loading States:**
   - Skeleton loaders
   - Suspense boundaries
   - Optimistic updates

5. **Type Safety:**
   - Use shared types from `@gsd/types` package
   - Generate API client from OpenAPI spec (if available)
   - Type-safe API calls

**Migration Path:**

The current implementation is designed to be easily migrated to TanStack Query:

```typescript
// Current (MVP):
const { user } = useAuth();

// Future (TanStack Query):
const { data: user } = useQuery({
  queryKey: ['auth', 'me'],
  queryFn: () => apiClient.get<UserDto>('/auth/me'),
});
```

The API client structure remains the same, only the state management layer changes.

---

### 10.12 Testing the Integration

**Manual Test Flow:**

1. Start backend: `pnpm dev:backend`
2. Start frontend: `pnpm dev:frontend`
3. Navigate to: `http://localhost:4321`
4. Should see login page (no auth yet)
5. Click "Sign in with Google"
6. Redirected to Google OAuth consent
7. Grant permission
8. Redirected back to `http://localhost:4321/auth/callback`
9. Then redirected to home page
10. Should see user menu with name/email
11. Click "Sign Out"
12. Should redirect to login page

**Expected Behavior:**

- ✅ Cookie set after OAuth callback
- ✅ User info displayed after sign-in
- ✅ API calls include cookie automatically
- ✅ Sign out clears cookie and redirects
- ✅ Protected routes redirect to login if not authenticated

---

## 11. Testing Strategy

### Unit Tests

- Test use cases in isolation (mock repositories)
- Test guards (mock JWT validation)
- Test strategies (mock Passport callbacks)

### Integration Tests

- Test OAuth callback flow (mock Google responses)
- Test JWT cookie setting and validation
- Test user creation on first sign-in

### E2E Tests

- Test full OAuth flow (mocked)
- Test protected endpoints with/without auth
- Test sign-out cookie clearing

---

## 11. Dependencies Summary

**New Dependencies:**

```json
{
  "@nestjs/passport": "^11.0.0",
  "@nestjs/jwt": "^11.0.0",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-jwt": "^4.0.1",
  "cookie-parser": "^1.4.6"
}
```

**Dev Dependencies:**

```json
{
  "@types/passport-google-oauth20": "^2.0.14",
  "@types/passport-jwt": "^4.0.1",
  "@types/cookie-parser": "^1.4.7"
}
```

---

## 12. Post-Implementation Checklist

- [ ] All endpoints protected with `JwtAuthGuard` (except `/auth/google` and `/auth/google/callback`)
- [ ] `mock-user-id` removed from all controllers
- [ ] Environment variables documented and set
- [ ] Google OAuth credentials configured in Google Cloud Console
- [ ] JWT secret is strong (32+ characters)
- [ ] Cookie attributes set correctly (HttpOnly, Secure in production)
- [ ] Unit tests written and passing
- [ ] E2E tests written and passing
- [ ] OpenAPI documentation updated
- [ ] Error logging implemented
- [ ] README updated with auth setup instructions
