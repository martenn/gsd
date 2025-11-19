# View Implementation Plan: Authentication Callback

## 1. Overview

The Authentication Callback view handles the OAuth redirect from Google after the user grants permission. This page processes the OAuth response server-side, sets the JWT HttpOnly cookie, and redirects the authenticated user to the main application. It displays a loading state during processing and error messaging if authentication fails.

## 2. View Routing

**Path:** `/auth/callback` (also potentially `/auth/google/callback` depending on backend config)

**View Type:** Astro static page with server-side processing

**Authentication:** Unauthenticated (transition point from unauthenticated to authenticated)

## 3. Component Structure

```
<AuthCallbackPage> (Astro page: src/pages/auth/callback.astro)
├── <LoadingState> (default state while processing)
│   ├── <LoadingSpinner>
│   └── <LoadingMessage>
└── <ErrorState> (conditional, if OAuth fails)
    ├── <ErrorMessage>
    ├── <ErrorDetails>
    └── <RetryButton>
```

## 4. Component Details

### `AuthCallbackPage` (Astro Page Component)

**Component Description:**
Server-side handler for Google OAuth callback. Processes OAuth code/state parameters, validates the response, and manages JWT cookie setup. Renders loading state by default and error state if authentication fails.

**Main HTML Elements:**
- `<html>` with lang attribute
- `<head>` with meta tags
- `<body>` with loading or error state
- `<main>` containing status display

**Handled Events:**
None (server-side processing, no client-side events except retry button)

**Validation Conditions:**
- OAuth state parameter validation (CSRF protection)
- OAuth code validation
- JWT token generation validation

**Types:**
```typescript
interface OAuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

interface AuthCallbackError {
  message: string;
  details?: string;
  canRetry: boolean;
}
```

**Props:**
None (Astro page, receives URL params)

**Server-Side Logic:**
```typescript
// Astro frontmatter (server-side)
const { code, state, error, error_description } = Astro.url.searchParams;

if (error) {
  // OAuth error (user cancelled or permission denied)
  // Render error state
}

if (!code || !state) {
  // Missing required parameters
  // Render error state
}

// Exchange code for tokens (backend handles this)
// Backend sets HttpOnly JWT cookie
// Redirect to /app/plan
return Astro.redirect('/app/plan');
```

---

### `LoadingState`

**Component Description:**
Default view displayed while OAuth processing occurs. Shows animated loading spinner and reassuring message to user.

**Main HTML Elements:**
- `<div>` container with centered layout
- `<LoadingSpinner>` SVG animation or component
- `<p>` with loading message
- ARIA live region for screen readers

**Handled Events:**
None (passive loading display)

**Validation Conditions:**
None

**Types:**
None

**Props:**
```typescript
interface LoadingStateProps {
  message?: string; // Default: "Signing you in..."
}
```

---

### `LoadingSpinner`

**Component Description:**
Animated spinner indicating processing state. Can be SVG animation, CSS spinner, or loading icon from lucide-react.

**Main HTML Elements:**
- `<svg>` with animation or `<div>` with CSS spinner
- Accessible attributes for screen readers

**Handled Events:**
None

**Validation Conditions:**
None

**Types:**
None

**Props:**
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'; // Default: 'md'
  className?: string;
}
```

---

### `ErrorState`

**Component Description:**
Displayed when OAuth authentication fails. Shows user-friendly error message, optional details, and recovery actions (retry or return to landing page).

**Main HTML Elements:**
- `<div>` container with error styling
- `<h1>` or `<h2>` with error title
- `<p>` with user-friendly error message
- `<p>` with error details (optional, for debugging)
- `<button>` or `<a>` for retry action
- `<a>` link back to landing page

**Handled Events:**
- `click` on Retry button: Navigates back to `/auth/google` to restart OAuth
- `click` on Home link: Navigates to `/`

**Validation Conditions:**
None

**Types:**
```typescript
interface ErrorStateProps {
  error: AuthCallbackError;
}
```

**Props:**
```typescript
interface ErrorStateProps {
  error: AuthCallbackError;
  onRetry?: () => void;
}
```

---

### `ErrorMessage`

**Component Description:**
User-friendly error message component that translates technical OAuth errors into readable text.

**Main HTML Elements:**
- `<p>` or `<div>` with error text
- Icon for visual error indication (optional)

**Handled Events:**
None

**Validation Conditions:**
None

**Types:**
```typescript
type ErrorType = 'access_denied' | 'invalid_request' | 'server_error' | 'unknown';
```

**Props:**
```typescript
interface ErrorMessageProps {
  type: ErrorType;
  message: string;
}
```

**Error Message Mapping:**
- `access_denied`: "You cancelled the sign-in process. Please try again to access GSD."
- `invalid_request`: "There was a problem with the sign-in request. Please try again."
- `server_error`: "We're experiencing technical difficulties. Please try again later."
- `unknown`: "An unexpected error occurred. Please try again or contact support."

---

### `RetryButton`

**Component Description:**
Button that allows user to restart OAuth flow after an error.

**Main HTML Elements:**
- `<button>` or `<a>` element
- Button text: "Try Again" or "Retry Sign-In"

**Handled Events:**
- `click`: Navigates to `/auth/google` or reloads current page

**Validation Conditions:**
None

**Types:**
None

**Props:**
```typescript
interface RetryButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}
```

---

## 5. Types

### OAuthCallbackParams

```typescript
/**
 * URL query parameters received from Google OAuth callback
 */
interface OAuthCallbackParams {
  /** OAuth authorization code (exchange for access token) */
  code?: string;

  /** OAuth state parameter (CSRF protection) */
  state?: string;

  /** OAuth error code (if user cancels or error occurs) */
  error?: string;

  /** Human-readable error description */
  error_description?: string;
}
```

### AuthCallbackError

```typescript
/**
 * Structured error information for display and handling
 */
interface AuthCallbackError {
  /** Error code for programmatic handling */
  code: 'access_denied' | 'invalid_request' | 'server_error' | 'unknown';

  /** User-friendly error message */
  message: string;

  /** Technical details (optional, for debugging) */
  details?: string;

  /** Whether user can retry the operation */
  canRetry: boolean;
}
```

### AuthCallbackState

```typescript
/**
 * Astro component state for conditional rendering
 */
type AuthCallbackState =
  | { status: 'loading' }
  | { status: 'error'; error: AuthCallbackError }
  | { status: 'success'; redirecting: true };
```

---

## 6. State Management

### Server-Side State (Astro Frontmatter)

**State:** OAuth processing state

**Management:**
- URL parameters parsed in Astro frontmatter (server-side)
- Conditional rendering based on presence of `error` or `code` params
- Backend handles JWT generation and cookie setting

**No React State:** This page is primarily server-side rendered. Loading and error states are determined at render time, not via client-side state management.

### Client-Side State (If Needed)

For enhanced UX (e.g., showing countdown timer during processing):

**State:** `isProcessing: boolean`

**Management:**
- React island with useEffect to auto-redirect after delay
- TanStack Query NOT needed (no data fetching from client)

---

## 7. API Integration

### OAuth Callback Processing

**Endpoint:** `GET /auth/google/callback`

**Purpose:** Backend endpoint that processes OAuth code and sets JWT cookie

**Request:**
- Method: GET
- Query Params: `code`, `state` (from Google OAuth redirect)
- Headers: None

**Response:**
- Success: HTTP 302 Redirect to `/app/plan`
- Error: HTTP 302 Redirect to `/auth/callback?error=...` or `/` with error param

**Backend Responsibilities:**
1. Validate OAuth state parameter (CSRF protection)
2. Exchange authorization code for Google access token
3. Fetch user info from Google
4. Create or update user record in database
5. Generate JWT token
6. Set HttpOnly cookie with JWT
7. Redirect to `/app/plan`

**Frontend Responsibilities:**
1. Display loading state while backend processes
2. Handle error parameters if backend redirects back with error
3. Provide retry mechanism for user

**Flow:**
```
1. User lands on /auth/callback?code=ABC&state=XYZ
2. Astro page renders loading state
3. Backend processes OAuth (via middleware or endpoint)
4. Backend sets JWT cookie
5. Backend redirects to /app/plan
6. User sees authenticated app
```

**Error Flow:**
```
1. User lands on /auth/callback?error=access_denied
2. Astro page detects error parameter
3. Error state rendered with message
4. User clicks "Try Again"
5. Navigate to /auth/google to restart flow
```

---

## 8. User Interactions

### Interaction 1: Successful Authentication (Happy Path)

**User Action:** Lands on `/auth/callback` from Google OAuth redirect

**System Response:**
1. Page displays loading spinner
2. Backend validates OAuth code
3. JWT cookie is set
4. User is redirected to `/app/plan`
5. User sees authenticated app shell

**Duration:** 1-3 seconds (imperceptible to user)

---

### Interaction 2: User Cancels OAuth Consent

**User Action:** Clicks "Cancel" on Google consent screen

**System Response:**
1. Google redirects to `/auth/callback?error=access_denied`
2. Error state displays: "You cancelled the sign-in process."
3. "Try Again" button is shown
4. User clicks "Try Again"
5. Redirected to `/auth/google` to restart flow

---

### Interaction 3: OAuth Error (Invalid Request)

**User Action:** Reaches callback with invalid or missing parameters

**System Response:**
1. Page detects missing `code` or invalid `state`
2. Error state displays: "There was a problem with the sign-in request."
3. "Try Again" button is shown
4. Optional: "Return Home" link to `/`

---

### Interaction 4: Backend Service Error

**User Action:** Backend `/auth/google/callback` endpoint fails

**System Response:**
1. Backend returns 500 error or redirects with error param
2. Error state displays: "We're experiencing technical difficulties."
3. "Try Again" button with retry capability
4. Error details logged (not shown to user in production)

---

## 9. Conditions and Validation

### Condition 1: OAuth Code Present

**Check:** `code` query parameter exists and is non-empty string

**Location:** Astro frontmatter (server-side)

**Action if True:** Proceed with OAuth processing

**Action if False:** Render error state

---

### Condition 2: OAuth State Parameter Matches

**Check:** `state` query parameter matches expected value (validated by backend)

**Location:** Backend (not frontend responsibility)

**Action if True:** Proceed with token exchange

**Action if False:** Backend returns error, frontend displays error state

**Security Note:** This prevents CSRF attacks. Frontend should never validate state itself.

---

### Condition 3: OAuth Error Present

**Check:** `error` query parameter exists

**Location:** Astro frontmatter (server-side)

**Action if True:** Parse error type and render appropriate error state

**Action if False:** Proceed with normal loading/success flow

**Error Types:**
- `access_denied`: User cancelled consent
- `invalid_request`: Malformed request
- `server_error`: Google OAuth service error
- Other: Treat as unknown error

---

### Condition 4: JWT Cookie Successfully Set

**Check:** Backend successfully generated JWT and set cookie

**Location:** Backend (not directly observable by frontend)

**Action if True:** Redirect to `/app/plan`

**Action if False:** Backend redirects back to callback with error

**Frontend Verification:**
- Not needed (backend handles)
- Middleware on `/app/*` routes will catch missing JWT and redirect to `/`

---

## 10. Error Handling

### Error Scenario 1: Missing OAuth Code

**Cause:** User navigates directly to `/auth/callback` without OAuth flow

**Detection:** Check for absence of `code` query parameter

**Handling:**
- Render error state with message: "Invalid authentication request."
- Provide "Sign In" button that navigates to `/` or `/auth/google`

**Implementation:**
```astro
---
const { code } = Astro.url.searchParams;

if (!code) {
  const error: AuthCallbackError = {
    code: 'invalid_request',
    message: 'Invalid authentication request. Please start from the sign-in page.',
    canRetry: true
  };
  // Render error state
}
---
```

---

### Error Scenario 2: OAuth Error from Google

**Cause:** User cancels consent or Google service error

**Detection:** Check for `error` query parameter

**Handling:**
- Parse error type from `error` parameter
- Display user-friendly message based on error type
- Show "Try Again" button for retryable errors

**Implementation:**
```astro
---
const { error, error_description } = Astro.url.searchParams;

if (error) {
  const authError: AuthCallbackError = {
    code: error as any,
    message: getErrorMessage(error),
    details: error_description,
    canRetry: error === 'access_denied' || error === 'invalid_request'
  };
  // Render error state
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'access_denied':
      return 'You cancelled the sign-in process. Please try again to access GSD.';
    case 'invalid_request':
      return 'There was a problem with the sign-in request. Please try again.';
    case 'server_error':
      return 'Google authentication service is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred during sign-in. Please try again.';
  }
}
---
```

---

### Error Scenario 3: Backend Token Exchange Fails

**Cause:** Backend cannot exchange code for access token

**Detection:** Backend returns error response or redirects with error

**Handling:**
- Backend should redirect to `/auth/callback?error=server_error`
- Frontend displays server error message
- Provide "Try Again" button

**Backend Responsibility:**
- Log detailed error for debugging
- Return generic error message to frontend (no sensitive info)

---

### Error Scenario 4: Network Timeout

**Cause:** Slow network or backend unresponsive

**Detection:** Browser timeout or backend timeout response

**Handling:**
- Display error: "Request timed out. Please check your connection and try again."
- Provide "Try Again" button
- Optional: Show retry countdown timer

---

### Error Scenario 5: Already Authenticated

**Cause:** User already has valid JWT cookie

**Detection:** Astro middleware detects JWT cookie

**Handling:**
- Skip OAuth processing
- Redirect directly to `/app/plan`
- No error, just optimization

**Implementation:**
```astro
---
const token = Astro.cookies.get('jwt')?.value;

if (token) {
  // Already authenticated, skip OAuth processing
  return Astro.redirect('/app/plan');
}
---
```

---

## 11. Implementation Steps

### Step 1: Create Astro Page File

**File:** `apps/frontend/src/pages/auth/callback.astro`

**Action:**
- Create new Astro page for callback route
- Set up basic HTML structure

---

### Step 2: Implement Server-Side OAuth Parameter Parsing

**Action:**
- Parse `code`, `state`, `error`, `error_description` from URL query params
- Add type definitions for parameters
- Implement conditional logic for success vs. error states

```astro
---
const { code, state, error, error_description } = Astro.url.searchParams;
---
```

---

### Step 3: Implement Loading State Component

**Action:**
- Create loading spinner (use lucide-react or CSS animation)
- Add loading message: "Signing you in..."
- Ensure ARIA live region announces loading state to screen readers
- Center content vertically and horizontally

---

### Step 4: Implement Error State Component

**Action:**
- Create error message component with icon
- Map OAuth error codes to user-friendly messages
- Add "Try Again" button
- Add "Return Home" link
- Style with Tailwind CSS (red/error theme)

---

### Step 5: Implement Backend Callback Endpoint Integration

**Note:** Backend endpoint should already exist (`GET /auth/google/callback`)

**Frontend Action:**
- Verify backend redirects correctly to `/app/plan` on success
- Verify backend redirects to `/auth/callback?error=...` on failure
- Test end-to-end OAuth flow

---

### Step 6: Add Conditional Rendering Logic

**Action:**
- If `error` param exists: render `ErrorState`
- If `code` param exists: render `LoadingState` (assume backend will redirect)
- If neither exists: render `ErrorState` with invalid request message

```astro
---
let pageState: 'loading' | 'error' = 'loading';
let authError: AuthCallbackError | null = null;

if (error) {
  pageState = 'error';
  authError = {
    code: error as any,
    message: getErrorMessage(error),
    details: error_description,
    canRetry: true
  };
} else if (!code) {
  pageState = 'error';
  authError = {
    code: 'invalid_request',
    message: 'Invalid authentication request.',
    canRetry: false
  };
}
---

{pageState === 'loading' && <LoadingState />}
{pageState === 'error' && <ErrorState error={authError!} />}
```

---

### Step 7: Implement Retry Functionality

**Action:**
- Add click handler to "Try Again" button
- Navigate to `/auth/google` to restart OAuth flow
- Can be simple anchor tag or button with onclick

```astro
<a href="/auth/google" class="btn btn-primary">
  Try Again
</a>
```

---

### Step 8: Add Accessibility Features

**Action:**
- Use semantic HTML (`<main>`, headings)
- Add ARIA live region for loading state: `<div role="status" aria-live="polite">`
- Ensure error messages are announced to screen readers
- Focus management: focus on "Try Again" button when error state renders

---

### Step 9: Implement Security Measures

**Action:**
- Verify backend validates OAuth state parameter (CSRF protection)
- Ensure JWT cookie has secure attributes (HttpOnly, Secure, SameSite=Strict)
- No sensitive data exposed in error messages
- Log errors server-side for debugging, not client-side

---

### Step 10: Handle Already-Authenticated State

**Action:**
- Check for existing JWT cookie in Astro frontmatter
- If valid JWT exists, skip OAuth processing and redirect to `/app/plan`
- Prevents unnecessary OAuth calls

---

### Step 11: Test OAuth Flow End-to-End

**Test Cases:**
1. **Success Path:**
   - Start from landing page
   - Click "Sign in with Google"
   - Grant permission on Google consent screen
   - Verify redirect to `/auth/callback?code=...&state=...`
   - Verify loading state displays briefly
   - Verify redirect to `/app/plan`
   - Verify JWT cookie is set

2. **User Cancels:**
   - Start OAuth flow
   - Click "Cancel" on Google consent screen
   - Verify redirect to `/auth/callback?error=access_denied`
   - Verify error message displays
   - Click "Try Again"
   - Verify restart of OAuth flow

3. **Invalid Request:**
   - Navigate directly to `/auth/callback` (no params)
   - Verify error state displays
   - Verify error message is clear

4. **Backend Error:**
   - Simulate backend failure (stop backend server)
   - Attempt OAuth flow
   - Verify appropriate error handling

5. **Already Authenticated:**
   - Complete OAuth flow once
   - Navigate to `/auth/callback` again
   - Verify immediate redirect to `/app/plan`

---

### Step 12: Optimize Loading Experience

**Action:**
- Add smooth transitions between states (optional)
- Ensure loading spinner animates smoothly
- Add auto-redirect with countdown if backend processing takes >5 seconds (edge case)

---

### Step 13: Add Error Logging (Optional for MVP, Required for Production)

**Action:**
- Log OAuth errors to console in development
- Send error telemetry to monitoring service in production (e.g., Sentry)
- Include error code, message, user agent, timestamp

---

### Step 14: Final Testing and Polish

**Checklist:**
- [ ] Loading state displays correctly
- [ ] Error state displays for all error types
- [ ] Retry button works and restarts OAuth
- [ ] Return home link navigates to `/`
- [ ] Accessibility: screen readers announce states
- [ ] Accessibility: keyboard navigation works
- [ ] Security: no sensitive info in error messages
- [ ] Performance: page loads quickly (<1s)
- [ ] Mobile: layout responsive on all screen sizes

---

## Implementation Notes

### OAuth Flow Diagram

```
┌─────────────┐
│ Landing Page│
│  (/) │
└──────┬──────┘
       │ User clicks "Sign in with Google"
       ↓
┌────────────────┐
│ /auth/google   │ (Backend endpoint)
└────────┬───────┘
         │ Backend redirects to Google OAuth
         ↓
┌──────────────────────┐
│ Google Consent Screen│
└──────────┬───────────┘
           │ User grants permission
           ↓
┌─────────────────────────────────┐
│ /auth/callback?code=...&state=..│ (This page)
└────────────┬────────────────────┘
             │
     ┌───────┴────────┐
     │                │
     ↓                ↓
┌─────────┐    ┌──────────┐
│ Loading │    │  Error   │
│  State  │    │  State   │
└────┬────┘    └────┬─────┘
     │              │ User clicks "Try Again"
     │              └────→ /auth/google
     ↓
┌──────────────┐
│ Backend sets │
│  JWT cookie  │
└──────┬───────┘
       │ Redirect to /app/plan
       ↓
┌──────────────┐
│ Authenticated│
│     App      │
└──────────────┘
```

### Backend Dependencies

This page requires the following backend endpoints to be implemented:

1. `POST /auth/google` - Initiates OAuth flow
2. `GET /auth/google/callback` - Processes OAuth callback, sets JWT cookie

Ensure backend is running and these endpoints are functional before testing this page.

### Error Message Best Practices

- Use friendly, non-technical language
- Avoid exposing technical error details to users in production
- Provide clear next steps (e.g., "Try again" or "Contact support")
- Log detailed errors server-side for debugging

### Accessibility Requirements

- Loading spinner must have `role="status"` and `aria-live="polite"`
- Error messages must be announced to screen readers
- Retry button must be keyboard accessible
- Focus should be managed (auto-focus retry button on error)

### Security Considerations

- OAuth state parameter validated by backend only (CSRF protection)
- No client-side state validation (prevents tampering)
- JWT cookie is HttpOnly (not accessible to JavaScript)
- Error messages do not expose sensitive information
- All OAuth flows happen over HTTPS in production
