# View Implementation Plan: Error Pages (404 & 500)

## 1. Overview

Error pages provide graceful error handling for common HTTP errors (404 Not Found and 500 Internal Server Error). These static Astro pages offer clear, user-friendly messaging and multiple recovery paths to help users continue their journey. The design prioritizes simplicity, reliability, and accessibility while maintaining consistency with the rest of the application.

## 2. View Routing

- **404 Page:** `/404` (automatically shown for unmatched routes)
- **500 Page:** `/500` (shown for internal server errors)
- **View Type:** Astro static pages (.astro files)

## 3. Component Structure

```
apps/frontend/src/pages/
├── 404.astro                    # 404 Not Found page
└── 500.astro                    # 500 Internal Server Error page

apps/frontend/src/components/errors/
└── ErrorLayout.astro            # Shared error page layout
```

**Hierarchy:**

```
ErrorLayout.astro (shared layout)
├── Header (minimal branding)
├── Main (error content)
│   ├── ErrorIcon (visual indicator)
│   ├── ErrorCode (large number)
│   ├── ErrorTitle (heading)
│   ├── ErrorMessage (description)
│   └── NavigationActions (recovery options)
└── Footer (minimal legal links)
```

## 4. Component Details

### 4.1 ErrorLayout.astro

**Purpose:** Shared layout component for all error pages providing consistent structure and styling.

**Main Elements:**
- Semantic HTML5 structure with `<header>`, `<main>`, `<footer>`
- Centered content container with max-width
- Minimal header with logo/branding
- Footer with links to Privacy and Terms pages

**Handled Interactions:**
- None (static layout)

**Validation Conditions:**
- None required

**Types:**
```typescript
interface ErrorLayoutProps {
  errorCode: number;        // HTTP status code (404, 500)
  title: string;            // Page title for <head>
  description?: string;     // Optional meta description
}
```

**Props:**
- `errorCode: number` - HTTP status code to display
- `title: string` - Page title for browser tab
- `description?: string` - Optional meta description for SEO

**Accessibility:**
- Semantic HTML landmarks (`<header>`, `<main>`, `<footer>`)
- Proper heading hierarchy (h1 for error title)
- Skip link to main content for screen readers
- High contrast text (WCAG AA 4.5:1 ratio)

---

### 4.2 404.astro

**Purpose:** Custom 404 Not Found page shown when users navigate to non-existent routes.

**Main Elements:**
- Error icon (lucide-react SearchX or FileQuestion)
- Large "404" display
- Heading: "Page Not Found"
- Description: "Sorry, the page you're looking for doesn't exist or has been moved."
- Navigation actions:
  - **Home Link:** Navigate to landing page (`/`)
  - **App Link:** Navigate to Plan Mode (`/app/plan`) - only show if authenticated
  - **Back Link:** Go to previous page (JavaScript: `history.back()`)

**Handled Interactions:**
- Click navigation links → Navigate to respective pages
- Click back button → Browser history back

**Validation Conditions:**
- Check if user is authenticated (read JWT cookie) to show/hide App link

**Types:**
```typescript
// No specific types needed - uses ErrorLayoutProps
```

**Props:**
- None (page component)

**Accessibility:**
- Error message announced to screen readers via `aria-live="polite"`
- Focus management: First link auto-focused on page load
- Links have descriptive text and aria-labels
- Keyboard navigable navigation actions

---

### 4.3 500.astro

**Purpose:** Custom 500 Internal Server Error page shown when server encounters unexpected errors.

**Main Elements:**
- Error icon (lucide-react AlertTriangle or ServerCrash)
- Large "500" display
- Heading: "Something Went Wrong"
- Description: "We're sorry, but something went wrong on our end. Our team has been notified and we're working on fixing it."
- Navigation actions:
  - **Home Link:** Navigate to landing page (`/`)
  - **Refresh Button:** Reload current page (JavaScript: `location.reload()`)
  - **Support Link (optional):** Contact support (mailto or external link)

**Handled Interactions:**
- Click home link → Navigate to landing page
- Click refresh button → Reload page
- Click support link → Open email client or support page

**Validation Conditions:**
- None required (show all actions regardless of authentication state)

**Types:**
```typescript
// No specific types needed - uses ErrorLayoutProps
```

**Props:**
- None (page component)

**Accessibility:**
- Error message announced to screen readers via `aria-live="assertive"` (higher priority)
- Focus management: Refresh button auto-focused on page load
- Buttons have descriptive aria-labels
- Support link clearly labeled

---

### 4.4 NavigationActions Component (Inline)

**Purpose:** Reusable navigation action buttons/links for error recovery.

**Main Elements:**
- Flexbox container for buttons
- Button/link variants:
  - Primary button (Home)
  - Secondary button (Back/Refresh)
  - Text link (Support)

**Handled Interactions:**
- Button clicks trigger navigation or page actions

**Validation Conditions:**
- None

**Types:**
```typescript
interface NavigationAction {
  label: string;           // Button text
  href?: string;          // Link destination (for <a> tags)
  onClick?: () => void;   // Click handler (for <button> tags)
  variant: 'primary' | 'secondary' | 'text';
  icon?: string;          // Optional lucide-react icon name
}
```

**Props:**
- `actions: NavigationAction[]` - Array of navigation actions to display

**Accessibility:**
- Buttons use semantic `<button>` or `<a>` tags appropriately
- Clear, descriptive labels
- Icon + text for visual + semantic meaning
- Proper focus order (tab sequence)

---

## 5. Types

### 5.1 Shared Types

```typescript
// apps/frontend/src/types/error-pages.ts

/**
 * Props for ErrorLayout component
 */
export interface ErrorLayoutProps {
  errorCode: number;        // HTTP status code (404, 500, etc.)
  title: string;            // Page title for browser tab
  description?: string;     // Optional meta description for SEO
}

/**
 * Navigation action configuration
 */
export interface NavigationAction {
  label: string;            // Button/link text
  href?: string;            // Link destination (for <a> tags)
  onClick?: () => void;     // Click handler (for <button> tags)
  variant: 'primary' | 'secondary' | 'text';
  icon?: string;            // Optional lucide-react icon name
  ariaLabel?: string;       // Optional explicit aria-label
}

/**
 * Error page metadata
 */
export interface ErrorPageMeta {
  code: number;             // HTTP status code
  title: string;            // Error page heading
  message: string;          // User-friendly error description
  actions: NavigationAction[];  // Available navigation/recovery actions
}
```

### 5.2 DTO Types

No specific DTOs needed - error pages are static and don't interact with the API. They may optionally read authentication state from cookies to conditionally show links.

---

## 6. State Management

**No client-side state management required.** These are completely static pages.

**Optional:** Check authentication state from cookie to conditionally show "Go to App" link on 404 page:
- Read JWT cookie on page load (Astro server-side)
- Pass `isAuthenticated` flag to page component
- Conditionally render App link based on flag

---

## 7. API Integration

**No API integration required.** These pages are shown when:
- Navigation fails (404)
- Server errors occur (500)

The pages should work independently of API availability.

---

## 8. User Interactions

### 8.1 404 Page Interactions

| User Action | Expected Outcome |
|------------|------------------|
| Click "Home" link | Navigate to landing page (`/`) |
| Click "Go to App" link (if authenticated) | Navigate to Plan Mode (`/app/plan`) |
| Click "Go Back" button | Browser history back (`window.history.back()`) |
| Press Tab key | Cycle through navigation links in order |

### 8.2 500 Page Interactions

| User Action | Expected Outcome |
|------------|------------------|
| Click "Home" link | Navigate to landing page (`/`) |
| Click "Refresh" button | Reload current page (`window.location.reload()`) |
| Click "Contact Support" link | Open email client or external support page |
| Press Tab key | Cycle through actions in order |

---

## 9. Conditions and Validation

### 9.1 Authentication Check (404 Page Only)

**Condition:** Show "Go to App" link only if user is authenticated.

**Verification:**
- Astro server-side: Read JWT cookie from request
- Check if cookie exists and is not expired (basic validation)
- Pass `isAuthenticated` boolean to page component
- Conditionally render App link in template

**Implementation:**
```astro
---
// 404.astro
const jwt = Astro.cookies.get('jwt');
const isAuthenticated = jwt !== undefined && jwt.value !== '';
---
```

### 9.2 No Other Validations

Error pages should be as simple and reliable as possible. No form validation, no complex logic.

---

## 10. Error Handling

**Critical:** Error pages themselves should never throw errors or fail to render.

**Best Practices:**
- Keep logic minimal and defensive
- Use try-catch blocks for any JavaScript navigation (back, reload)
- Provide fallback if icons fail to load (use text emoji or skip icon)
- Ensure pages render correctly even if CSS fails to load (readable text)

**Example:**
```astro
<script>
  // Defensive back button handler
  const backButton = document.getElementById('back-btn');
  backButton?.addEventListener('click', () => {
    try {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      // Fallback to home if history.back() fails
      window.location.href = '/';
    }
  });
</script>
```

---

## 11. Implementation Steps

### Step 1: Create ErrorLayout Component
1. Create `apps/frontend/src/components/errors/ErrorLayout.astro`
2. Define props interface (errorCode, title, description)
3. Implement semantic HTML structure:
   - `<html>` with lang attribute
   - `<head>` with title, meta tags
   - `<body>` with header, main, footer
4. Style with Tailwind CSS:
   - Centered container (max-w-2xl mx-auto)
   - Vertical centering (min-h-screen flex flex-col justify-center)
   - Consistent spacing and typography
5. Add minimal header:
   - Logo/branding (linked to home)
   - No navigation menu (keep simple)
6. Add minimal footer:
   - Links to Privacy and Terms pages
   - Copyright text (optional)
7. Add skip link for accessibility

### Step 2: Create 404 Page
1. Create `apps/frontend/src/pages/404.astro`
2. Import ErrorLayout component
3. Check authentication status:
   - Read JWT cookie from Astro.cookies
   - Set isAuthenticated flag
4. Define page content:
   - Error code: 404
   - Title: "Page Not Found"
   - Message: User-friendly explanation
5. Import lucide-react icon (SearchX or FileQuestion)
6. Implement navigation actions:
   - Home link (always visible)
   - App link (conditional on authentication)
   - Back button (with defensive JavaScript)
7. Style with Tailwind:
   - Large error code (text-9xl font-bold)
   - Prominent heading (text-4xl font-semibold)
   - Readable description (text-lg text-gray-600)
   - Button styling (primary, secondary, text variants)
8. Add aria-live region for screen reader announcement

### Step 3: Create 500 Page
1. Create `apps/frontend/src/pages/500.astro`
2. Import ErrorLayout component
3. Define page content:
   - Error code: 500
   - Title: "Something Went Wrong"
   - Message: Apology and reassurance
4. Import lucide-react icon (AlertTriangle or ServerCrash)
5. Implement navigation actions:
   - Home link
   - Refresh button (with defensive JavaScript)
   - Support link (optional, mailto or external)
6. Style consistently with 404 page
7. Add aria-live="assertive" for higher priority announcement

### Step 4: Style with Tailwind CSS
1. Use consistent color palette:
   - Primary color for main actions
   - Gray tones for text hierarchy
   - Red accent for error codes (optional)
2. Responsive design:
   - Mobile: Single column, stacked buttons
   - Desktop: Larger text, horizontal button layout
3. Button variants:
   - Primary: bg-primary text-white hover:bg-primary-dark
   - Secondary: bg-gray-200 text-gray-800 hover:bg-gray-300
   - Text: text-primary underline hover:text-primary-dark
4. Icon styling:
   - Large size (w-24 h-24 or similar)
   - Muted color (text-gray-400)
   - Centered above error code

### Step 5: Add Navigation Handlers
1. Implement back button handler:
   ```astro
   <script>
     const backBtn = document.getElementById('back-btn');
     backBtn?.addEventListener('click', (e) => {
       e.preventDefault();
       try {
         window.history.back();
       } catch {
         window.location.href = '/';
       }
     });
   </script>
   ```
2. Implement refresh button handler:
   ```astro
   <script>
     const refreshBtn = document.getElementById('refresh-btn');
     refreshBtn?.addEventListener('click', (e) => {
       e.preventDefault();
       window.location.reload();
     });
   </script>
   ```
3. Test handlers in browsers (Chrome, Firefox, Safari, Edge)

### Step 6: Configure Astro
1. Ensure Astro is configured to use custom 404 page:
   - Astro automatically uses `src/pages/404.astro` if it exists
2. Configure server to return 404.astro for unmatched routes
3. Configure server to return 500.astro for server errors
   - May require custom error middleware

### Step 7: Test Accessibility
1. **Screen Reader Testing:**
   - VoiceOver (macOS): Verify error messages are announced
   - NVDA/JAWS (Windows): Verify navigation is clear
2. **Keyboard Navigation:**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test Enter/Space on buttons
3. **WCAG Compliance:**
   - Check color contrast (use WebAIM contrast checker)
   - Verify heading hierarchy (h1 for error title)
   - Ensure all images have alt text (icons)
4. **Focus Management:**
   - Verify first link is auto-focused on page load
   - Test focus trap (not applicable - no modals)

### Step 8: Test User Flows
1. **404 Testing:**
   - Navigate to non-existent route (e.g., `/invalid-path`)
   - Verify 404 page displays correctly
   - Test all navigation actions
   - Test as authenticated and unauthenticated user
2. **500 Testing:**
   - Trigger server error (simulate or use dev tools)
   - Verify 500 page displays correctly
   - Test refresh and home navigation
3. **Edge Cases:**
   - Test with JavaScript disabled (links should still work)
   - Test with CSS disabled (page should be readable)
   - Test on slow connection (page should load quickly)

### Step 9: Mobile Testing
1. Test on actual mobile devices or emulators:
   - iOS Safari
   - Android Chrome
2. Verify responsive layout:
   - Error code and text are readable
   - Buttons are large enough to tap (min 44x44px)
   - Spacing prevents accidental taps
3. Test touch interactions:
   - Tap home link
   - Tap back/refresh buttons
   - Verify no touch delays

### Step 10: Documentation
1. Document error page usage in project README or docs
2. Add comments to ErrorLayout explaining customization
3. Document environment variables if support email is configurable
4. Add examples of how to trigger error pages (for testing)

---

## Summary

This implementation plan provides a comprehensive blueprint for creating simple, reliable, and accessible error pages (404 and 500) for the GSD application. The pages prioritize user recovery with clear messaging and multiple navigation options while maintaining consistency with the overall application design.

**Key Features:**
- Static Astro pages for maximum reliability
- Shared ErrorLayout component for consistency
- Multiple recovery paths (home, back, refresh)
- Conditional "Go to App" link based on authentication
- Fully accessible with screen reader support
- Responsive design for mobile and desktop
- Defensive error handling (error pages should never fail)

**No External Dependencies:**
- No API calls required
- No state management needed
- No complex JavaScript (only basic navigation)
- Works even if main app is broken

**Ready for Implementation:** All components, types, and interactions are clearly defined. Frontend developers can implement this view in approximately 2-4 hours with styling and testing.
