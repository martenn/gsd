# View Implementation Plan: Landing Page

## 1. Overview

The Landing Page is the entry point for unauthenticated users. It's a simple, static page built with Astro that displays the GSD branding and provides a Google sign-in button. This is the simplest view in the application and serves as an excellent starting point for frontend development.

**Purpose**: Allow users to sign in with Google OAuth and access the authenticated application.

**Technology**: Astro static page (no React needed for this view)

## 2. View Routing

**Path**: `/` (root route)

**File Location**: `apps/frontend/src/pages/index.astro`

## 3. Component Structure

```
Landing Page (index.astro)
├── Header
│   └── Logo
├── Hero Section
│   ├── Headline
│   ├── Tagline
│   └── GoogleSignInButton
└── Footer
    ├── Privacy Policy Link
    └── Terms of Service Link
```

## 4. Component Details

### Landing Page (Main Container)
- **Description**: The root Astro page component that contains all other components
- **Main elements**:
  - `<html>` with proper lang attribute
  - `<head>` with meta tags and title
  - `<body>` with semantic layout structure
- **Handled interactions**: None (delegated to child components)
- **Validation**: None required
- **Types**: None (Astro component, no TypeScript needed)
- **Props**: None (top-level page)

### Header Component
- **Description**: Simple header with logo and product name
- **Main elements**:
  - `<header>` semantic element
  - Logo (can be text or SVG for MVP)
  - Product name "GSD"
- **Handled interactions**: None (static display)
- **Validation**: None
- **Types**: None
- **Props**: None

**Simplified Implementation**: For MVP, use text-based logo instead of SVG/image.

### Hero Section
- **Description**: Central content area with value proposition and call-to-action
- **Main elements**:
  - `<main>` semantic element with ARIA landmark
  - `<h1>` headline
  - `<p>` tagline/description
  - GoogleSignInButton component
- **Handled interactions**: None directly (button handles click)
- **Validation**: None
- **Types**: None
- **Props**: None

**Simplified Text Content**:
- Headline: "GSD - Getting Shit Done"
- Tagline: "A simple, keyboard-first productivity app for focused work."

### GoogleSignInButton Component
- **Description**: Primary call-to-action button that initiates OAuth flow
- **Main elements**:
  - `<a>` element styled as button (href to `/auth/google`)
  - Button text
  - Optional Google icon (omit for MVP)
- **Handled interactions**:
  - Click → navigates to `/auth/google` endpoint (handled by backend)
- **Validation**: None required (standard link navigation)
- **Types**: None
- **Props**: None

**Simplified Implementation**:
- Use `<a>` tag instead of button (simpler, works without JavaScript)
- Href: `/auth/google` (backend endpoint)
- Style with Tailwind as button-like element
- No icon for MVP, just text: "Sign in with Google"

### Footer Component
- **Description**: Bottom section with legal links
- **Main elements**:
  - `<footer>` semantic element
  - Two `<a>` links for Privacy and Terms pages
- **Handled interactions**: Click on links navigates to legal pages
- **Validation**: None
- **Types**: None
- **Props**: None

**Simplified Implementation**:
- Plain text links, minimal styling
- Links: `/privacy` and `/terms` (will create later)
- For MVP, links can be non-functional stubs

## 5. Types

**No custom types required** for this view. It's a pure Astro static page with no dynamic data or TypeScript logic.

## 6. State Management

**No state management required**. The page is completely static with no interactive state.

## 7. API Integration

**No API integration** on this page. The Google sign-in button links directly to the backend OAuth endpoint at `/auth/google`, which is handled entirely server-side.

**Backend endpoint** (already implemented):
- `GET /auth/google` - Initiates Google OAuth flow

## 8. User Interactions

### Sign In Flow
1. User lands on the page
2. User clicks "Sign in with Google" button
3. Browser navigates to `/auth/google` (backend endpoint)
4. Backend redirects to Google OAuth consent screen
5. (Subsequent flow handled by authentication callback, not this view)

**No client-side JavaScript required** for this interaction - it's a standard HTML link navigation.

## 9. Conditions and Validation

**No conditions or validation** required for this page. It's a simple static entry point.

**Future consideration** (post-MVP): Check if user is already authenticated and redirect to `/app/plan` automatically.

## 10. Error Handling

### Minimal Error Handling for MVP
- No error states on this page itself
- If `/auth/google` endpoint fails, backend handles the error
- User would remain on this page if navigation fails (browser default behavior)

**Post-MVP**: Display error message if redirected back from failed auth attempt.

## 11. Implementation Steps

### Step 1: Create Basic Astro Page Structure
Create `apps/frontend/src/pages/index.astro` with:
- HTML boilerplate
- Semantic structure (`<header>`, `<main>`, `<footer>`)
- Basic meta tags (title, charset, viewport)

**Acceptance criteria**:
- File exists and Astro dev server renders it without errors
- Page displays in browser at http://localhost:4321/

### Step 2: Add Header with Logo
Inside the Astro file, add:
- `<header>` element
- Text logo "GSD" (can enhance with styling later)
- Basic Tailwind classes for spacing

**Acceptance criteria**:
- Header visible at top of page
- Logo text displays correctly

### Step 3: Add Hero Section with Content
Add to `<main>`:
- `<h1>` with "GSD - Getting Shit Done"
- `<p>` with tagline
- Center content with Tailwind utility classes

**Acceptance criteria**:
- Headline and tagline visible and centered
- Text is readable (good font size and contrast)

### Step 4: Add Google Sign-In Button
Add to Hero section:
- `<a href="/auth/google">` styled as button
- Text: "Sign in with Google"
- Tailwind button styling (background color, padding, hover state)

**Acceptance criteria**:
- Button displays below tagline
- Clicking button navigates to `/auth/google`
- Button has hover effect

### Step 5: Add Footer with Legal Links
Add `<footer>` with:
- Privacy Policy link (href="/privacy")
- Terms of Service link (href="/terms")
- Basic styling (small text, centered, bottom of page)

**Acceptance criteria**:
- Footer visible at bottom of page
- Links display (even if destinations don't exist yet)

### Step 6: Add Basic Styling and Accessibility
Apply final touches:
- Tailwind classes for spacing, colors, typography
- Ensure semantic HTML is used throughout
- Add `lang="en"` to `<html>`
- Add `aria-label` attributes where needed
- Ensure minimum 44x44px touch target for button

**Acceptance criteria**:
- Page looks clean and professional (don't over-style)
- Passes basic accessibility checks (semantic HTML, contrast)
- Button is easily clickable on mobile and desktop

### Step 7: Test Manually
1. Start Astro dev server: `pnpm --filter @gsd/frontend dev`
2. Open browser to http://localhost:4321/
3. Verify:
   - Page loads without errors
   - All content displays correctly
   - Sign-in button is clickable
   - Layout works on different screen sizes (resize browser)

**Acceptance criteria**:
- No console errors
- Page displays correctly
- Button click navigates (even if backend returns 404, navigation should work)

## Implementation Order Summary

1. **Start**: Create basic Astro page file
2. **Add structure**: Header, main, footer sections
3. **Add content**: Text content (headline, tagline)
4. **Add interaction**: Sign-in button
5. **Polish**: Basic styling and accessibility
6. **Test**: Manual testing in browser

## Beginner-Friendly Notes

### What Makes This Simple?
- **No React**: Uses Astro's simpler .astro file format
- **No TypeScript**: No types or interfaces needed
- **No State**: No useState, useEffect, or complex logic
- **No API Calls**: Just a link to backend endpoint
- **Static Content**: Everything is hard-coded text
- **Minimal Styling**: Basic Tailwind classes only

### Things to Skip for MVP
- ❌ Google logo/icon (use text only)
- ❌ Animations or transitions
- ❌ Dark mode toggle
- ❌ Complex responsive design (basic mobile-friendly is enough)
- ❌ Auto-redirect if already authenticated
- ❌ Loading states
- ❌ Error messages

### Questions to Ask
- **Styling**: What specific colors should be used? (For now, use Tailwind defaults: blue-600 for button)
- **Logo**: Should it be text or do we need a logo file? (Use text for MVP)
- **Legal pages**: Should the links work now or later? (Later is fine)

### Expected Time
- **Estimated**: 30-60 minutes for complete implementation
- **Breakdown**:
  - File creation and structure: 10 mins
  - Content and button: 15 mins
  - Styling: 15 mins
  - Testing: 10-20 mins

### Success Criteria
You're done when:
1. ✅ Page loads at http://localhost:4321/
2. ✅ "Sign in with Google" button is visible and clickable
3. ✅ Clicking button navigates to `/auth/google`
4. ✅ Page looks reasonably good on desktop and mobile
5. ✅ No console errors

## Next Steps After Landing Page

After successfully implementing the landing page:
1. Implement Authentication Callback page (`/auth/callback`)
2. Create basic App Shell for authenticated views
3. Implement Plan Mode (most complex view)

## File Structure Preview

```
apps/frontend/src/pages/
└── index.astro          # Landing page (this implementation)
```

Future files (not part of this implementation):
```
apps/frontend/src/pages/
├── index.astro          # ← We're implementing this
├── auth/
│   └── callback.astro   # Next: Auth callback
├── privacy.astro        # Later: Privacy policy
├── terms.astro          # Later: Terms of service
└── app/
    └── [...slug].astro  # Later: React SPA for authenticated app
```
