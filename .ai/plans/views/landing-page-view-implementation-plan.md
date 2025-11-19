# View Implementation Plan: Landing Page

## 1. Overview

The Landing Page serves as the unauthenticated entry point for GSD (Getting Shit Done). Its primary purpose is to present the application's value proposition and provide a single, clear call-to-action: signing in with Google OAuth. This page is built as an Astro static page for optimal performance and SEO.

## 2. View Routing

**Path:** `/`

**View Type:** Astro static page (`.astro` file)

**Authentication:** Unauthenticated (public access)

## 3. Component Structure

```
<LandingPage> (Astro page: src/pages/index.astro)
├── <Header>
│   ├── <Logo>
│   └── <ProductName>
├── <Hero>
│   ├── <Tagline>
│   ├── <ValueProposition>
│   └── <GoogleSignInButton>
└── <Footer>
    ├── <PrivacyPolicyLink>
    └── <TermsOfServiceLink>
```

## 4. Component Details

### `LandingPage` (Astro Page Component)

**Component Description:**
Top-level Astro page component that renders the landing page structure. Handles layout, styling, and integration of child components.

**Main HTML Elements:**
- `<html>` with lang attribute
- `<head>` with meta tags, title, viewport configuration
- `<body>` with semantic structure
- `<main>` containing hero section
- `<header>` with logo and branding
- `<footer>` with legal links

**Handled Events:**
None (static page with delegated button events)

**Validation Conditions:**
None (no form validation on this page)

**Types:**
None required (static content)

**Props:**
None (Astro page, not a component)

---

### `Header`

**Component Description:**
Top navigation bar displaying the application logo and name. Provides brand identity and visual anchor for the page.

**Main HTML Elements:**
- `<header>` with semantic HTML5 tag
- `<nav>` wrapper for accessibility
- Logo image or SVG
- Product name heading (`<h1>`)

**Handled Events:**
None

**Validation Conditions:**
None

**Types:**
None

**Props:**
None (can be extracted as reusable component later)

---

### `Hero`

**Component Description:**
Central section of the landing page featuring the main value proposition, tagline, and primary call-to-action. This is the focal point for user conversion.

**Main HTML Elements:**
- `<section>` with hero styling classes
- `<h1>` or `<h2>` for tagline
- `<p>` for value proposition description
- `<GoogleSignInButton>` component

**Handled Events:**
None (button events handled by child component)

**Validation Conditions:**
None

**Types:**
None

**Props:**
None

---

### `GoogleSignInButton`

**Component Description:**
Primary call-to-action button that initiates the Google OAuth flow. Styled as a prominent, accessible button with Google branding guidelines. This can be a React island or simple HTML button.

**Main HTML Elements:**
- `<button>` or `<a>` element (depending on implementation)
- Google icon (SVG or image)
- Button text: "Sign in with Google"

**Handled Events:**
- `click`: Navigates to `/auth/google` endpoint to initiate OAuth flow

**Validation Conditions:**
None (no form input to validate)

**Types:**
None required for simple button

**Props:**
None (if simple HTML) or:
```typescript
interface GoogleSignInButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}
```

**Implementation Note:**
Button should navigate to `POST /auth/google` which redirects to Google's consent screen. This can be a simple anchor tag or button with onClick handler.

---

### `Footer`

**Component Description:**
Footer section containing links to legal pages (Privacy Policy, Terms of Service). Provides required legal compliance and navigation to policy documents.

**Main HTML Elements:**
- `<footer>` semantic HTML5 tag
- `<nav>` for link grouping
- `<a>` links to `/privacy` and `/terms`

**Handled Events:**
None (standard navigation links)

**Validation Conditions:**
None

**Types:**
None

**Props:**
None

---

## 5. Types

**No custom types required for MVP.**

The landing page is primarily static content with no complex data structures. If the GoogleSignInButton is implemented as a reusable React component, the props interface is minimal (shown in Component Details above).

## 6. State Management

**State Management:** None required.

The landing page is stateless. Navigation to the OAuth flow is handled via simple HTTP redirect, not client-side state management.

**No TanStack Query needed:** This page does not fetch data from the backend.

**No React Context needed:** No shared state across components.

## 7. API Integration

### Authentication Initiation

**Endpoint:** `POST /auth/google`

**Purpose:** Initiates Google OAuth 2.0 flow

**Request:**
- Method: GET or POST (typically GET via anchor tag navigation)
- Body: None
- Headers: None

**Response:**
- HTTP 302 Redirect to Google OAuth consent screen

**Frontend Implementation:**
Simple anchor tag or button that navigates to `/auth/google`:

```html
<a href="/auth/google" class="btn btn-primary">
  Sign in with Google
</a>
```

Or React button with navigation:

```tsx
<button onClick={() => window.location.href = '/auth/google'}>
  Sign in with Google
</button>
```

**No response handling needed:** Backend handles OAuth redirect automatically.

## 8. User Interactions

### Primary Interaction: Sign In with Google

**User Action:** Clicks "Sign in with Google" button

**Expected Outcome:**
1. Browser navigates to `/auth/google` endpoint
2. Backend redirects user to Google OAuth consent screen
3. User grants permission on Google's page
4. Google redirects back to `/auth/callback`
5. Backend sets JWT HttpOnly cookie
6. User is redirected to `/app/plan` (authenticated app)

**Error Scenarios:**
- User cancels OAuth consent: Redirected back to landing page (handled by backend)
- OAuth error: Error page with message (handled by backend callback handler)

### Secondary Interactions: Legal Page Navigation

**User Action:** Clicks "Privacy Policy" or "Terms of Service" link

**Expected Outcome:**
- Browser navigates to `/privacy` or `/terms` page
- Static legal document displayed

## 9. Conditions and Validation

**No validation required** on this page.

The landing page has no forms or input fields. The only action is navigation to the OAuth endpoint, which has no client-side validation requirements.

## 10. Error Handling

### Scenario 1: OAuth Already Initiated

**Condition:** User is already authenticated (has valid JWT cookie)

**Handling:**
- Astro middleware should detect authenticated state
- Redirect to `/app/plan` instead of showing landing page
- Prevents unnecessary OAuth re-initiation

**Implementation:**
Add middleware check in Astro:

```typescript
// src/middleware/auth.ts
export async function onRequest({ cookies, redirect, url }, next) {
  const token = cookies.get('jwt')?.value;

  if (token && url.pathname === '/') {
    // User already authenticated, redirect to app
    return redirect('/app/plan');
  }

  return next();
}
```

### Scenario 2: OAuth Endpoint Unavailable

**Condition:** Backend `/auth/google` endpoint is down or unreachable

**Handling:**
- Browser will display connection error (native browser error page)
- No custom frontend handling needed for MVP
- Future: Add health check and display maintenance message

### Scenario 3: Google OAuth Service Unavailable

**Condition:** Google's OAuth service is down

**Handling:**
- Handled by Google's error page
- User sees Google's error message
- Backend callback handler catches errors and redirects to landing with error message (future enhancement)

## 11. Implementation Steps

### Step 1: Create Astro Page File

**File:** `apps/frontend/src/pages/index.astro`

**Action:**
- Create new Astro page at root path
- Set up HTML structure with semantic tags
- Configure meta tags and page title

### Step 2: Implement Header Component

**Action:**
- Add header with logo and product name
- Use semantic `<header>` and `<nav>` tags
- Apply Tailwind CSS styling for clean, minimal design

### Step 3: Implement Hero Section

**Action:**
- Create hero section with centered layout
- Add tagline (e.g., "Get Stuff Done. Stay Focused.")
- Add value proposition paragraph
- Use large font sizes and ample spacing

### Step 4: Implement Google Sign-In Button

**Option A: Simple HTML Anchor Tag**

```astro
<a
  href="/auth/google"
  class="inline-flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
>
  <GoogleIcon />
  Sign in with Google
</a>
```

**Option B: React Island (if interactive feedback needed)**

Create React component in `apps/frontend/src/components/GoogleSignInButton.tsx`

### Step 5: Implement Footer with Legal Links

**Action:**
- Add footer with links to `/privacy` and `/terms`
- Use semantic `<footer>` tag
- Style with Tailwind CSS for subtle, non-intrusive appearance

### Step 6: Add Responsive Styling

**Action:**
- Use Tailwind responsive classes (sm:, md:, lg:)
- Ensure button is large enough on mobile (min 44x44px touch target)
- Test on mobile, tablet, desktop viewports

### Step 7: Implement Accessibility Features

**Action:**
- Add semantic HTML tags throughout
- Ensure proper heading hierarchy (h1 for main heading)
- Add skip link for screen readers: "Skip to main content"
- Ensure high contrast text (WCAG AA 4.5:1 ratio)
- Add aria-label to sign-in button if needed

### Step 8: Add Google Icon

**Action:**
- Use lucide-react icon or custom SVG
- Ensure icon meets Google branding guidelines
- Position icon to left of button text

### Step 9: Test OAuth Flow

**Action:**
- Start backend server (ensure `/auth/google` endpoint is live)
- Click "Sign in with Google" button
- Verify redirect to Google consent screen
- Grant permission and verify redirect to `/app/plan`
- Check that JWT cookie is set (via browser DevTools)

### Step 10: Add Security Headers

**Action:**
- Ensure HTTPS in production
- Configure CSP headers via backend (no inline scripts)
- Verify no XSS vulnerabilities (no user input on this page)

### Step 11: Optimize Performance

**Action:**
- Minimize CSS (Tailwind JIT mode)
- Optimize images (use Astro Image component if logo is image)
- Ensure fast page load (<1s on 3G)
- Add preconnect hints for Google OAuth domain

### Step 12: Handle Already-Authenticated State

**Action:**
- Implement Astro middleware to check JWT cookie
- Redirect authenticated users from `/` to `/app/plan`
- Test flow: sign in, manually navigate to `/`, verify redirect to app

### Step 13: Final Testing

**Checklist:**
- [ ] Page loads without errors
- [ ] Sign-in button navigates to Google OAuth
- [ ] OAuth flow completes successfully
- [ ] Legal links navigate to correct pages
- [ ] Responsive on mobile, tablet, desktop
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader announces content correctly
- [ ] Already-authenticated users are redirected to app

---

## Implementation Notes

### Styling Guidelines

- Use Tailwind CSS utility classes exclusively (no custom CSS for MVP)
- Follow shadcn/ui design tokens for consistency with authenticated app
- Ensure large, accessible touch targets on mobile (min 44x44px)
- Use subtle animations for hover states (optional)

### Content Placeholders

For MVP, use simple placeholder content:

**Tagline:** "Get Stuff Done. Stay Focused."

**Value Proposition:** "A keyboard-first productivity app for solo users. Plan your work, execute with focus, track your progress."

Final copy can be refined post-MVP.

### Google Branding Compliance

Ensure button follows Google's branding guidelines:
- Use official Google logo
- Follow specified color schemes
- Meet accessibility requirements

Reference: [Google Sign-In Branding Guidelines](https://developers.google.com/identity/branding-guidelines)

### Security Considerations

- HTTPS-only in production
- No sensitive data on this page
- OAuth state parameter validated on backend (prevents CSRF)
- JWT HttpOnly cookie set by backend (not accessible to JavaScript)

### Future Enhancements (Post-MVP)

- Add feature highlights or screenshots
- Include testimonials or social proof
- Add animated hero background
- Implement A/B testing for conversion optimization
- Add analytics tracking (Google Analytics, Plausible, etc.)
