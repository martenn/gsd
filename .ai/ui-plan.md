# UI Architecture for GSD (Getting Shit Done)

**Document Version:** 1.0
**Date:** 2025-11-05
**Status:** Ready for Implementation
**Based On:** PRD v1.0, OpenAPI Specification v1.0, MVP UI Architecture Summary

---

## 1. UI Structure Overview

GSD is a keyboard-first productivity application built as a responsive web app targeting desktop and mobile browsers. The UI architecture leverages Astro's islands architecture for static pages (landing, authentication, legal) and a React 19 single-page application (SPA) for the authenticated experience.

### Application Architecture

**Static Layer (Astro):**
- Landing page with Google OAuth entry point
- Authentication callback handler
- Legal pages (Privacy Policy, Terms of Service)
- Server-side redirects for unauthenticated access

**Dynamic Layer (React SPA):**
- Mounted at `/app/*` for all authenticated routes
- Client-side routing for instant mode switching
- Three primary modes: Plan, Work, Done
- Modal overlays for Dump Mode, Command Palette, and Help

### Core Design Principles

1. **Keyboard-First Interaction:** Arrow keys as primary navigation, vim-style alternatives (h/j/k/l), comprehensive keyboard shortcuts for all operations
2. **Progressive Disclosure:** Focus users on current task (Work Mode) while providing full control when needed (Plan Mode)
3. **Responsive Design:** Desktop experience optimized for keyboard and multi-column layout; mobile optimized for touch with single-column, swipeable interface
4. **Optimistic UI:** Immediate feedback for high-confidence operations (reordering, completion) with rollback on failure
5. **Accessibility-First:** WCAG AA compliance, screen reader support, proper focus management, ARIA attributes via shadcn/ui components

### Technology Stack

- **Framework:** Astro (static) + React 19 (SPA)
- **Styling:** Tailwind CSS with shadcn/ui component library
- **State Management:** TanStack Query for server state, React Context for keyboard navigation, local state via hooks
- **Forms:** react-hook-form + zod validation
- **Icons:** lucide-react
- **Routing:** Astro pages for static, React Router for SPA

---

## 2. View List

### 2.1 Landing Page (Unauthenticated)

**View Path:** `/`
**View Type:** Astro static page

**Main Purpose:**
Entry point for unauthenticated users to sign in via Google OAuth.

**Key Information to Display:**
- Product branding (logo, name)
- Value proposition tagline
- Google sign-in call-to-action
- Footer with legal page links

**Key View Components:**
- `<Header>` - Logo and product name
- `<Hero>` - Tagline and value proposition copy
- `<GoogleSignInButton>` - Primary CTA triggering OAuth flow
- `<Footer>` - Privacy Policy and Terms of Service links

**UX Considerations:**
- Minimal, focused design to reduce friction
- Large, accessible sign-in button (minimum 44x44px touch target)
- Clear visual hierarchy guiding user to sign-in action

**Accessibility Considerations:**
- Semantic HTML (`<main>`, `<header>`, `<footer>`)
- High contrast text (WCAG AA 4.5:1 ratio)
- Descriptive button text ("Sign in with Google")
- Skip link to main content for screen readers

**Security Considerations:**
- HTTPS-only in production
- Google OAuth 2.0 with secure redirect URI
- No sensitive data collection on this page
- CORS headers configured for API domain only

---

### 2.2 Authentication Callback

**View Path:** `/auth/callback`
**View Type:** Astro static page with server-side processing

**Main Purpose:**
Handle OAuth redirect from Google, set JWT cookie, redirect to authenticated app.

**Key Information to Display:**
- Loading state while processing OAuth response
- Error message if authentication fails

**Key View Components:**
- `<LoadingSpinner>` - Visual feedback during processing
- `<ErrorMessage>` - Display authentication errors with retry option

**UX Considerations:**
- Immediate visual feedback (loading spinner)
- Clear error messaging if OAuth fails
- Automatic redirect on success (no user action required)

**Accessibility Considerations:**
- Loading state announced to screen readers (aria-live="polite")
- Error messages with clear recovery instructions
- Focus management on error state

**Security Considerations:**
- Validate OAuth state parameter to prevent CSRF
- Set HttpOnly, Secure, SameSite=Strict cookie attributes
- Server-side JWT generation and validation
- Redirect to HTTPS-only authenticated routes

---

### 2.3 Plan Mode

**View Path:** `/app/plan`
**View Type:** React SPA route

**Main Purpose:**
Comprehensive task and list management interface with keyboard-first navigation. Users create, edit, delete, reorder, and move tasks across multiple lists organized in a left-to-right flow (backlogs → intermediate lists → Done).

**Key Information to Display:**
- All non-Done lists (backlogs in left column, intermediate lists in scrollable area)
- All tasks within each list, ordered by user-defined priority
- Current keyboard selection state (selected task or list)
- List and task limits (visual indicators at 80% and 100%)
- Active work list indicator (rightmost non-Done list)

**Key View Components:**

**Layout Components:**
- `<PlanModeLayout>` - Top-level container with app header and board area
- `<AppHeader>` - Mode switcher, command palette trigger, help trigger, user menu
- `<BoardLayout>` - Two-column layout (backlog column + intermediate lists area)
- `<BacklogColumn>` - Fixed-width (280px) left column with vertically stacked backlogs
- `<IntermediateListsContainer>` - Horizontal scrollable area for intermediate lists

**List Components:**
- `<ListColumn>` - Individual list container (280px width)
- `<ListHeader>` - List name (editable), task count badge, actions menu, limit indicator
- `<ListBody>` - Scrollable task container
- `<TaskRow>` - Task card with title, description, origin color border, actions
- `<ListActionsMenu>` - Rename, delete, toggle backlog, reorder options
- `<CreateListButton>` - Trigger for new list creation (disabled at 10 lists)

**Task Components:**
- `<TaskCard>` - Read-only task display with selection state
- `<TaskEditForm>` - Inline editable form for title and description
- `<TaskActionsMenu>` - Edit, delete, move, complete options
- `<TaskColorIndicator>` - 4px left border showing origin backlog color

**Interaction Components:**
- `<KeyboardNavigationProvider>` - React Context managing selection state
- `<InlineTaskCreator>` - Appears at top of list on 'n' key press
- `<ListLimitIndicator>` - Badge showing task count with color coding
- `<EmptyListState>` - Placeholder when list has no tasks

**UX Considerations:**
- **Keyboard Navigation:** Arrow keys (↑↓←→) for primary navigation, vim-style (h/j/k/l) as alternates
- **Visual Focus:** Clear selection ring on focused task/list (ring-2 ring-offset-2)
- **Inline Editing:** Tasks and lists editable in-place without modals
- **Limit Feedback:** Disabled controls with tooltips explaining limits
- **Optimistic Updates:** Immediate visual feedback for reordering and movement
- **Horizontal Scroll:** Smooth scrolling between intermediate lists with mouse wheel or trackpad

**Accessibility Considerations:**
- **ARIA Roles:** Board as grid, lists as columns, tasks as cells
- **Keyboard Focus:** All interactive elements reachable via Tab
- **Screen Reader Announcements:** Live regions for task creation, deletion, completion
- **Focus Management:** Focus follows keyboard selection (selected task gets aria-current="true")
- **Semantic HTML:** Lists as `<ul>`, tasks as `<li>`, buttons as `<button>`

**Security Considerations:**
- All mutations require valid JWT cookie
- Task/list IDs validated on backend to prevent cross-user access
- Input sanitization via react-hook-form + zod
- No dangerouslySetInnerHTML usage

---

### 2.4 Work Mode

**View Path:** `/app/work`
**View Type:** React SPA route

**Main Purpose:**
Focused execution view displaying the top task from the active work list (rightmost non-Done list) with a short forecast of upcoming tasks. Users complete tasks one at a time with minimal distraction.

**Key Information to Display:**
- Current task (title, description, origin backlog color)
- Forecast of next 2-3 tasks in active list
- Active list name context
- Completion action

**Key View Components:**

**Layout Components:**
- `<WorkModeLayout>` - Full-width centered layout with app header
- `<AppHeader>` - Same as Plan Mode for consistent navigation

**Task Display Components:**
- `<CurrentTaskCard>` - Large, prominent card for top task
  - Title (large, bold font)
  - Description (full text, readable size)
  - Origin color indicator (thick left border or badge with backlog name)
  - Complete button (primary, bottom-right)
  - Keyboard shortcut hint
- `<ForecastSection>` - Container for upcoming tasks
  - "Up Next" heading
  - 2-3 `<ForecastTaskCard>` components (smaller, read-only)
- `<ForecastTaskCard>` - Compact task display
  - Title only (or truncated description)
  - Origin color indicator
  - Non-interactive, for context only

**Empty State Components:**
- `<EmptyWorkState>` - Displayed when active list has no tasks
  - Message: "No tasks in [Active List Name]"
  - Actions: "Add Task" (n) and "Switch to Plan Mode" (Cmd+P)

**Action Components:**
- `<CompleteButton>` - Primary CTA to mark current task complete
- `<SwitchToPlanButton>` - Secondary action for reordering needs

**UX Considerations:**
- **Single Focus:** Only current task is actionable; forecast is read-only
- **Visual Hierarchy:** Large current task card dominates viewport
- **Immediate Feedback:** Optimistic update on completion; current task fades out, next task animates in
- **Context Awareness:** Active list name shown in header or breadcrumb
- **Empty State Guidance:** Clear actions when no tasks available
- **Minimal UI:** No list navigation, no multi-task selection, focus on execution

**Accessibility Considerations:**
- **Keyboard Shortcuts:** Complete task via keyboard (e.g., Space or Enter)
- **Focus Management:** Complete button auto-focused on view load
- **Screen Reader:** Current task announced as "Current task: [title]"
- **ARIA Live Region:** Completion triggers announcement of next task
- **Semantic Structure:** Main task as `<main>`, forecast as `<aside>`

**Security Considerations:**
- Complete action requires authentication
- Task ID validated on backend
- No exposure of other users' tasks

---

### 2.5 Done Archive

**View Path:** `/app/done`
**View Type:** React SPA route

**Main Purpose:**
Paginated, read-only view of completed tasks in reverse chronological order. Displays completion metrics in header (daily, weekly counts). Allows users to review past accomplishments.

**Key Information to Display:**
- Metrics summary (today's count, this week's count, last week's count)
- Paginated list of completed tasks (50 per page)
- Completion timestamps (relative and absolute)
- Task origin backlog colors
- Pagination controls

**Key View Components:**

**Layout Components:**
- `<DoneArchiveLayout>` - Full-width layout with app header and metrics header
- `<AppHeader>` - Same as other modes

**Metrics Components:**
- `<MetricsHeader>` - Compact bar below app header
  - Daily count: "Today: X tasks"
  - Weekly count: "This week: Y tasks"
  - Last week count: "Last week: Z tasks"
  - Timezone indicator (subtle, e.g., "PST")
- `<MetricBadge>` - Individual metric display with icon and count

**Task List Components:**
- `<CompletedTaskList>` - Container for paginated tasks (reverse chronological)
- `<CompletedTaskCard>` - Read-only task display
  - Title (bold)
  - Description (if present, truncated or full)
  - Completion timestamp (relative: "2 hours ago", absolute: "Jan 5, 2025 3:42 PM")
  - Origin backlog color (4px left border)
- `<PaginationControls>` - Page navigation
  - Previous/Next buttons
  - Page number indicators (e.g., 1, 2, 3, ..., 10)
  - Results count: "Showing 1-50 of 237"

**Empty State Components:**
- `<EmptyDoneState>` - Displayed when no tasks completed yet
  - Message: "No completed tasks yet"
  - Action: "Start completing tasks in Work Mode"

**UX Considerations:**
- **Read-Only:** No actions on completed tasks (no edit, delete, reopen)
- **Pagination:** 50 tasks per page for performance and usability
- **Timestamps:** Displayed in user's local timezone
- **Relative Times:** Humanized ("2 hours ago") for recent completions, absolute for older
- **Metrics Context:** Immediate visibility of accomplishments in header
- **Retention Notice:** Tooltip or info message: "Last 500 completed tasks retained"

**Accessibility Considerations:**
- **Semantic HTML:** Task list as `<ul>`, tasks as `<li>`
- **Pagination:** ARIA labels for page numbers, current page marked with aria-current="page"
- **Timestamps:** Both relative and absolute times for screen reader context
- **Keyboard Navigation:** Pagination controls navigable via Tab

**Security Considerations:**
- Only authenticated user's completed tasks visible
- Backend enforces user data isolation
- Pagination parameters validated to prevent abuse

---

### 2.6 Dump Mode (Modal)

**View Path:** N/A (Modal overlay, accessible from any authenticated view)
**View Type:** React modal component

**Main Purpose:**
Quick multi-line task creation into a selected backlog. Triggered by `Cmd+Shift+D` from any view. Allows users to paste or type multiple task titles (one per line, max 10 lines) for rapid task capture.

**Key Information to Display:**
- Multi-line text input area (max 10 lines)
- Target backlog selector (dropdown)
- Line/task count indicator
- Action buttons (submit, cancel)

**Key View Components:**

**Modal Components:**
- `<DumpModeModal>` - Overlay with darkened background
- `<ModalContent>` - Centered card with form

**Form Components:**
- `<DumpModeForm>` - Form container with validation
- `<TaskTitleTextarea>` - Multi-line input (autofocused)
  - Placeholder: "Enter task titles (one per line, max 10)"
  - Max 10 lines enforced
- `<BacklogSelector>` - Dropdown for target backlog selection
  - Remembers last used backlog (localStorage)
  - Shows backlog name and color indicator
- `<LineCounter>` - Real-time count: "5/10 lines"
- `<SubmitButton>` - Primary action: "Add to [Backlog Name]"
- `<CancelButton>` - Secondary action: "Cancel" or Esc key

**UX Considerations:**
- **Autofocus:** Textarea focused immediately on modal open
- **Keyboard Shortcuts:** Enter to submit (or Cmd+Enter), Esc to cancel
- **Line Limit:** Disable submit if >10 lines, show error message
- **Blank Line Handling:** Automatically removed on submission
- **Duplicate Handling:** Allowed (no deduplication)
- **Last Used Backlog:** Dropdown pre-selects last used for convenience
- **Non-Blocking:** Modal appears over current view, user returns to same view after submission

**Accessibility Considerations:**
- **Focus Trap:** Tab cycles within modal (doesn't escape to background)
- **ARIA Dialog:** Modal marked with role="dialog", aria-modal="true"
- **Screen Reader:** Modal title announced on open
- **Keyboard Navigation:** All controls accessible via keyboard
- **Close Button:** Visible X button in addition to Esc key

**Security Considerations:**
- Input sanitized before submission
- Max 10 lines enforced client-side and server-side
- Target backlog ID validated on backend

---

### 2.7 Keyboard Help Overlay (Modal)

**View Path:** N/A (Modal overlay, accessible via `?` key from any view)
**View Type:** React modal component

**Main Purpose:**
Display comprehensive list of keyboard shortcuts, categorized by context (Global, Plan Mode, Work Mode). Includes search/filter functionality for discoverability.

**Key Information to Display:**
- Categorized keyboard shortcuts
- Search/filter input
- Key + description for each shortcut

**Key View Components:**

**Modal Components:**
- `<KeyboardHelpModal>` - Overlay with semi-transparent background
- `<ModalContent>` - Centered card with scrollable content

**Content Components:**
- `<SearchInput>` - Filter shortcuts by keyword
- `<ShortcutCategorySection>` - Grouped shortcuts
  - "Global Shortcuts" (Cmd+P, Cmd+W, Cmd+D, Cmd+K, ?)
  - "Plan Mode Shortcuts" (Arrow keys, n, e, l, etc.)
  - "Work Mode Shortcuts" (Complete, Switch to Plan)
- `<ShortcutRow>` - Individual shortcut display
  - Left: Keyboard key(s) in styled badge (e.g., `Cmd` `P`)
  - Right: Description (e.g., "Switch to Plan Mode")
- `<CloseButton>` - Dismiss modal (X button or Esc)

**UX Considerations:**
- **Search:** Real-time filtering of shortcuts by keyword
- **Categorization:** Logical grouping for easier scanning
- **Visual Keys:** Keyboard keys styled as distinct badges
- **Scrollable:** Content scrolls if exceeds viewport height
- **Dismissal:** Multiple ways to close (? key, Esc, X button, click outside)

**Accessibility Considerations:**
- **Focus Trap:** Tab cycles within modal
- **ARIA Dialog:** role="dialog", aria-labelledby pointing to title
- **Keyboard Navigation:** Search input and close button accessible via Tab
- **Screen Reader:** Shortcuts announced as "Press [key] to [action]"

**Security Considerations:**
- No user input beyond search filter
- Static content, no backend interaction

---

### 2.8 Command Palette (Modal)

**View Path:** N/A (Modal overlay, accessible via `Cmd+K` from any view)
**View Type:** React modal component (shadcn/ui Command component)

**Main Purpose:**
Quick access to common actions via keyboard search. Provides discoverability for users who prefer search over memorizing shortcuts.

**Key Information to Display:**
- Search input for filtering actions
- List of available actions (contextual to current mode)
- Keyboard navigation hints

**Key View Components:**

**Modal Components:**
- `<CommandPaletteModal>` - Overlay with subtle background (cmdk)
- `<CommandInput>` - Search input (autofocused)
- `<CommandList>` - Filtered action results

**Action Components:**
- `<CommandGroup>` - Grouped actions (Navigation, Tasks, Lists)
- `<CommandItem>` - Individual action
  - Icon (if applicable)
  - Action name (e.g., "Create Task")
  - Keyboard shortcut hint (e.g., "n")

**Pre-Populated Actions:**
- Navigation: "Go to Plan Mode", "Go to Work Mode", "Go to Done Archive"
- Tasks: "Create Task", "Complete Current Task"
- Lists: "Create List", "Toggle Backlog Status"
- Other: "Show Keyboard Shortcuts", "Open Dump Mode"

**UX Considerations:**
- **Instant Search:** Real-time filtering as user types
- **Keyboard Navigation:** ↑↓ to select, Enter to execute
- **Fuzzy Search:** Forgiving matching (e.g., "crtsk" matches "Create Task")
- **Recently Used:** Optionally show recent actions at top
- **Dismissal:** Esc or click outside to close

**Accessibility Considerations:**
- **Focus Trap:** Tab cycles within modal
- **ARIA Combobox:** Search input with role="combobox", aria-expanded
- **ARIA Live Region:** Results announced as user types
- **Keyboard Navigation:** Fully accessible via keyboard

**Security Considerations:**
- Actions validated before execution
- No arbitrary command execution
- Pre-defined action list only

---

### 2.9 Error Pages (404, 500)

**View Path:** `/404`, `/500` (or dynamic error handling)
**View Type:** Astro static pages

**Main Purpose:**
Graceful error handling for not found (404) and internal server errors (500). Provide clear messaging and navigation options for recovery.

**Key Information to Display:**
- Error code and title
- User-friendly error message
- Navigation options

**Key View Components:**

**404 Not Found:**
- `<ErrorLayout>` - Centered layout with header and footer
- `<ErrorMessage>` - "Page not found" with explanation
- `<NavigationActions>` - Links to home, Plan Mode, or previous page

**500 Internal Server Error:**
- `<ErrorLayout>` - Same as 404
- `<ErrorMessage>` - "Something went wrong" with apology
- `<NavigationActions>` - Links to home, refresh button
- `<SupportLink>` - Optional contact support link

**UX Considerations:**
- **Clear Messaging:** Avoid technical jargon
- **Recovery Path:** Multiple options to continue (home, back, refresh)
- **Consistency:** Use same header/footer as rest of site

**Accessibility Considerations:**
- **Semantic HTML:** Main content in `<main>`, navigation in `<nav>`
- **Focus Management:** First link focused on page load
- **Screen Reader:** Error message announced on page load

**Security Considerations:**
- No sensitive error details exposed to user
- Server logs capture full error for debugging
- Generic messaging prevents information leakage

---

### 2.10 Legal Pages (Privacy, Terms)

**View Path:** `/privacy`, `/terms`
**View Type:** Astro static pages

**Main Purpose:**
Display legal policies (Privacy Policy, Terms of Service) in accessible, readable format.

**Key Information to Display:**
- Legal document content (text, headings, lists)
- Last updated date
- Navigation back to main site

**Key View Components:**
- `<LegalPageLayout>` - Simple layout with header, content, footer
- `<Header>` - Logo and link back to home
- `<LegalContent>` - Markdown-rendered legal text
- `<Footer>` - Standard footer with links

**UX Considerations:**
- **Readability:** Large font, ample line spacing, narrow column width
- **Table of Contents:** Jump links to sections for long documents
- **Print-Friendly:** Styles optimized for printing

**Accessibility Considerations:**
- **Semantic HTML:** Proper heading hierarchy (h1, h2, h3)
- **Skip Links:** Skip to main content
- **High Contrast:** Text meets WCAG AA standards

**Security Considerations:**
- Static content, no user input
- HTTPS-only

---

## 3. User Journey Map

### Primary User Journey: Daily Planning and Execution

**Stage 1: Authentication**
1. User navigates to Landing Page (`/`)
2. User clicks "Sign in with Google" button
3. Redirected to Google OAuth consent screen
4. User grants permission
5. Redirected to Auth Callback (`/auth/callback`)
6. Backend sets JWT HttpOnly cookie
7. Redirected to Plan Mode (`/app/plan`)

**Stage 2: Initial Setup (First-Time User)**
1. User arrives at Plan Mode with default setup:
   - One backlog: "Backlog"
   - One intermediate list: "Today"
   - Done list (hidden from main board)
2. Onboarding tooltip or guide (optional) highlights keyboard shortcuts (`?` for help)

**Stage 3: Planning (Plan Mode)**
1. User creates tasks in Backlog:
   - Presses `n` (new task) while backlog is selected
   - Inline editable row appears at top of Backlog
   - Types task title, optionally adds description
   - Presses Enter to save
   - Repeats for multiple tasks
2. User organizes tasks:
   - Uses arrow keys to navigate between tasks
   - Presses move shortcut to move task from Backlog to Today
   - Task appears at top of Today list
   - Uses Cmd+Up/Down to reorder tasks within Today
3. User creates additional lists:
   - Presses `l` (new list)
   - Types list name (e.g., "Week")
   - List appears to the right of Today
   - User moves tasks from Backlog to Week for weekly planning

**Stage 4: Quick Task Capture (Dump Mode)**
1. User has sudden burst of ideas
2. Presses `Cmd+Shift+D` from any view
3. Dump Mode modal appears
4. User pastes or types multiple task titles (one per line, max 10)
5. Selects target backlog from dropdown (defaults to last used)
6. Presses Enter or clicks "Add to Backlog"
7. Tasks created at top of selected backlog
8. Modal closes, user returns to previous view

**Stage 5: Execution (Work Mode)**
1. User presses `Cmd+W` to switch to Work Mode
2. Sees top task from Today list (active work list = rightmost non-Done)
3. Current task displayed prominently with title, description, origin color
4. Forecast shows next 2-3 tasks below
5. User works on current task
6. When complete, presses Complete button or shortcut (e.g., Space)
7. Optimistic update: current task fades out, moves to Done
8. Next task in forecast becomes current task
9. Forecast refreshes to show new next 2-3 tasks
10. User repeats until Today list is empty
11. Empty state appears: "No tasks in Today" with actions to add task or switch to Plan

**Stage 6: Review Progress (Done Archive)**
1. User presses `Cmd+D` to switch to Done Archive
2. Sees metrics header: "Today: 8 tasks • This week: 32 tasks • Last week: 28 tasks"
3. Sees paginated list of completed tasks (newest first)
4. Each task shows completion timestamp (e.g., "2 hours ago"), origin color
5. User navigates through pages to review history
6. Feels sense of accomplishment from visible progress

**Stage 7: Discovering Features**
1. User presses `?` to open Keyboard Help overlay
2. Scans categorized shortcuts (Global, Plan Mode, Work Mode)
3. Uses search to filter shortcuts (e.g., types "create" to find task/list creation)
4. Learns about Command Palette
5. Presses `Cmd+K` to open Command Palette
6. Types "create" and selects "Create Task" from results
7. Task creation initiated from current view

**Stage 8: Mobile Usage**
1. User accesses GSD on mobile device
2. Plan Mode shows one list at a time (full width)
3. Header dropdown allows selecting different lists
4. Swipes left/right to navigate between adjacent lists
5. Position indicators (dots) show current list in sequence
6. Taps floating action button (+) to create task
7. Work Mode is full-screen with large Complete button
8. Dump Mode appears as bottom sheet modal
9. Done Archive scrolls vertically with pagination at bottom

**Stage 9: Sign Out**
1. User clicks user menu in app header
2. Selects "Sign Out"
3. Backend clears JWT cookie
4. TanStack Query cache invalidated
5. Redirected to Landing Page

---

### Alternative User Journeys

**Journey: Error Recovery**
1. User attempts to create 11th list (limit is 10)
2. "Create List" button is disabled
3. Tooltip on hover: "Maximum 10 lists reached. Delete a list to create new one."
4. User deletes an unused list via list actions menu
5. Deletion modal prompts for destination list for tasks
6. User selects destination, confirms
7. List deleted, tasks moved to destination
8. "Create List" button re-enabled

**Journey: Network Failure**
1. User attempts to complete task while offline
2. Optimistic update shows task moving to Done
3. Background API call fails
4. UI rolls back optimistic update
5. Inline error appears: "Failed to complete task. Check your connection and try again."
6. Retry button appears next to error
7. User clicks retry when connection restored
8. Task completes successfully

**Journey: Limit Enforcement**
1. User has 95 tasks in Today list
2. List header shows yellow badge: "95/100"
3. User adds 5 more tasks (now at 100)
4. List header shows red badge: "100/100"
5. "Create Task" action disabled for Today list
6. User presses `n` while Today is selected
7. Tooltip appears: "List is full (max 100 tasks). Delete or move tasks to add more."
8. User moves tasks to Week list or deletes completed tasks
9. Badge updates to "97/100" (yellow)
10. "Create Task" action re-enabled

---

## 4. Layout and Navigation Structure

### Routing Structure

```
/ (Landing - Astro static page)
  ├─ /auth/callback (Auth Callback - Astro static page)
  ├─ /privacy (Privacy Policy - Astro static page)
  ├─ /terms (Terms of Service - Astro static page)
  └─ /app/* (React SPA)
       ├─ /app/plan (Plan Mode - client-side route, default)
       ├─ /app/work (Work Mode - client-side route)
       └─ /app/done (Done Archive - client-side route)
```

**Middleware:**
- Astro middleware checks for JWT cookie on `/app/*` routes
- Unauthenticated requests redirect to `/`
- Expired/invalid JWT clears cookie, redirects to `/`

**Client-Side Routing:**
- React Router within SPA for `/app/*` routes
- Instant navigation between modes (no page reload)
- Browser back/forward buttons work as expected
- URL reflects current mode for bookmarking

---

### Navigation Patterns

#### Global Navigation (Authenticated Views)

**App Header (Always Visible):**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] [Plan | Work | Done]          [Cmd+K] [?] [User Menu]   │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Logo:** Clickable, returns to Plan Mode
- **Mode Switcher:** Segmented control or tabs highlighting current mode
- **Command Palette Trigger:** Icon button (search icon) with tooltip "Cmd+K"
- **Help Trigger:** Icon button (?) with tooltip "Keyboard shortcuts"
- **User Menu:** Dropdown with "Account" and "Sign out"

**Global Keyboard Shortcuts (Work Everywhere):**
- `Cmd+P` → Navigate to Plan Mode
- `Cmd+W` → Navigate to Work Mode
- `Cmd+D` → Navigate to Done Archive
- `Cmd+Shift+D` → Open Dump Mode modal
- `Cmd+K` → Open Command Palette
- `?` → Open Keyboard Help overlay

---

#### Plan Mode Navigation

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                        App Header                                │
├──────────────┬──────────────────────────────────────────────────┤
│   Backlogs   │        Intermediate Lists (Horizontal Scroll)    │
│   (Fixed)    │                                                  │
│              │  ┌──────┐  ┌──────┐  ┌──────┐                  │
│  ┌──────┐    │  │ Week │  │Today │  │      │                  │
│  │ Work │    │  │      │  │ (Act)│  │      │                  │
│  │      │    │  │  •   │  │  •   │  │      │                  │
│  │  •   │    │  │  •   │  │  •   │  │      │                  │
│  └──────┘    │  │  •   │  │  •   │  │      │                  │
│              │  └──────┘  └──────┘  └──────┘                  │
│  ┌──────┐    │                                                  │
│  │Garden│    │                                                  │
│  │  •   │    │                                                  │
│  └──────┘    │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

**Keyboard Navigation:**
- **Arrow Keys (Primary):**
  - `↑` / `↓` → Navigate between tasks within a list
  - `←` / `→` → Navigate between lists (horizontal)
- **Vim-Style (Alternates):**
  - `j` / `k` → Navigate between tasks (down/up)
  - `h` / `l` → Navigate between lists (left/right)
- **Action Shortcuts:**
  - `n` → Create new task in selected list
  - `e` or `Enter` → Edit selected task
  - `l` → Create new list
  - `Delete` or `Backspace` → Delete selected task/list
  - `Cmd+Up` / `Cmd+Down` → Reorder selected task within list
  - `Cmd+Left` / `Cmd+Right` → Reorder selected list
  - `m` → Move selected task (opens list selector)
  - `Space` → Complete selected task

**Selection State:**
- Visual focus indicator (ring-2 ring-offset-2 on task/list)
- `aria-current="true"` on focused element
- Persisted in sessionStorage (restored on return to Plan Mode)

---

**Mobile Layout:**
```
┌─────────────────────────────────┐
│       App Header                │
├─────────────────────────────────┤
│ [Backlog v]   ← • • • →        │ ← List selector + position dots
├─────────────────────────────────┤
│                                 │
│        List: Today              │
│                                 │
│  • Task 1 (origin color)        │
│  • Task 2                       │
│  • Task 3                       │
│                                 │
│                                 │
│                        [+]      │ ← Floating action button
└─────────────────────────────────┘
```

**Mobile Navigation:**
- **Swipe Gestures:**
  - Swipe left → Navigate to next list (right)
  - Swipe right → Navigate to previous list (left)
- **Header Dropdown:** Tap to open list selector (all backlogs + intermediate lists)
- **Position Indicators:** Dots below dropdown show current list in sequence
- **Floating Action Button:** Create new task in current list
- **Tap Actions:** Tap task to open action menu (edit, delete, move, complete)

---

#### Work Mode Navigation

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                        App Header                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     Working on: Today                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  Review PRD document                                     │    │
│  │  Check for completeness and clarity before sharing      │    │
│  │  Origin: Work                                            │    │
│  │                                                          │    │
│  │                                          [Complete]      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Up Next:                                                        │
│  • Update API documentation (Origin: Work)                       │
│  • Create test plan (Origin: Work)                               │
│  • Schedule team meeting (Origin: Work)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Keyboard Navigation:**
- `Space` or `Enter` → Complete current task
- `Cmd+P` → Switch to Plan Mode (for reordering)
- `n` → Add new task (opens Dump Mode or creates in active list)

**Mobile Layout:**
- Full-screen current task card
- Complete button at bottom (large, easy to tap)
- Forecast below (scrollable if more than 3 tasks)
- No swipe gestures (single task focus)

---

#### Done Archive Navigation

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                        App Header                                │
├─────────────────────────────────────────────────────────────────┤
│  Today: 8 tasks • This week: 32 tasks • Last week: 28 tasks     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Review PRD document                                             │
│  Origin: Work • Completed 2 hours ago                            │
│                                                                  │
│  Update API documentation                                        │
│  Origin: Work • Completed 3 hours ago                            │
│                                                                  │
│  ...                                                             │
│                                                                  │
│  [<] [1] [2] [3] ... [10] [>]        Showing 1-50 of 237        │
└─────────────────────────────────────────────────────────────────┘
```

**Keyboard Navigation:**
- `Tab` → Navigate between pagination controls
- `Enter` → Activate selected page number
- No task selection (read-only view)

**Mobile Layout:**
- Metrics header (stacked vertically if needed)
- Vertically scrolling task list
- Pagination at bottom (simplified: [< Prev] [Next >])

---

### Modal Navigation

**Modals (Dump Mode, Keyboard Help, Command Palette):**
- **Opening:** Triggered by keyboard shortcuts or UI buttons
- **Focus Trap:** Tab cycles within modal (doesn't escape to background)
- **Closing:** Esc key, X button, or click outside (for non-critical modals)
- **Focus Management:** First interactive element auto-focused on open
- **Background:** Main view dims or blurs, remains visible but non-interactive

---

## 5. Key Components

### 5.1 Layout Components

#### `<AppShell>`
**Purpose:** Top-level authenticated app container
**Responsibilities:**
- Render app header with mode switcher
- Manage authentication state (redirect if unauthenticated)
- Provide React Router outlet for mode views
- Wrap app in TanStack Query and Keyboard Navigation providers

**Key Props:**
- None (reads from context and routing)

**Child Components:**
- `<AppHeader>`
- `<ModeView>` (Plan, Work, or Done based on route)

---

#### `<AppHeader>`
**Purpose:** Persistent navigation header across all authenticated views
**Responsibilities:**
- Display logo and mode switcher
- Provide quick access to Command Palette and Help
- Render user menu with sign-out option

**Key Props:**
- `currentMode: 'plan' | 'work' | 'done'` - Highlights active mode in switcher

**Child Components:**
- `<Logo>`
- `<ModeSwitcher>`
- `<CommandPaletteTrigger>`
- `<HelpTrigger>`
- `<UserMenu>`

**Accessibility:**
- Semantic `<nav>` element
- ARIA current on active mode tab

---

#### `<BoardLayout>` (Plan Mode)
**Purpose:** Two-column layout for Plan Mode
**Responsibilities:**
- Render fixed-width backlog column on left
- Render horizontal-scrollable intermediate lists area on right
- Manage keyboard navigation context across lists

**Key Props:**
- `backlogs: List[]` - Array of backlog lists
- `intermediateLists: List[]` - Array of intermediate lists
- `selectedListId: string | null` - Current keyboard selection
- `selectedTaskId: string | null` - Current keyboard selection

**Child Components:**
- `<BacklogColumn backlogs={backlogs} />`
- `<IntermediateListsContainer lists={intermediateLists} />`

**Responsive:**
- Desktop: Two-column layout (280px fixed left, rest horizontal scroll)
- Mobile: Single-column swipeable (handled by different component)

---

### 5.2 List Components

#### `<ListColumn>`
**Purpose:** Individual list container (backlog or intermediate)
**Responsibilities:**
- Render list header and body
- Handle vertical scrolling of tasks
- Manage list-level actions (rename, delete, toggle backlog)

**Key Props:**
- `list: ListDto` - List data (id, name, isBacklog, color, taskCount)
- `tasks: TaskDto[]` - Array of tasks in this list
- `isSelected: boolean` - Whether this list has keyboard focus
- `onSelect: () => void` - Callback when list receives focus

**Child Components:**
- `<ListHeader>`
- `<ListBody>`

**Styling:**
- Fixed width: 280px (desktop), 240px (tablet), 100vw (mobile)
- Distinct background for backlogs vs intermediate
- Border-left if backlog (using backlog color)

---

#### `<ListHeader>`
**Purpose:** List title, actions, and metadata
**Responsibilities:**
- Display editable list name
- Show task count badge with limit indicator
- Provide actions menu (rename, delete, toggle backlog, reorder)

**Key Props:**
- `list: ListDto`
- `onRename: (newName: string) => void`
- `onDelete: () => void`
- `onToggleBacklog: () => void`

**Child Components:**
- `<EditableListName>`
- `<TaskCountBadge>`
- `<ListActionsMenu>`

**Accessibility:**
- List name as `<h2>` or `<h3>`
- Actions menu as `<button>` with aria-label

---

#### `<ListBody>`
**Purpose:** Scrollable container for tasks
**Responsibilities:**
- Render task rows in order
- Handle empty state
- Support virtualization if needed (TBD)

**Key Props:**
- `tasks: TaskDto[]`
- `listId: string`
- `selectedTaskId: string | null`

**Child Components:**
- `<TaskRow>` (for each task)
- `<EmptyListState>` (if no tasks)
- `<InlineTaskCreator>` (when creating new task)

**Styling:**
- Vertical scroll (overflow-y: auto)
- Max height based on viewport minus header

---

### 5.3 Task Components

#### `<TaskRow>`
**Purpose:** Individual task display in Plan Mode
**Responsibilities:**
- Display task title, description (truncated), origin color
- Show selection state (keyboard focus)
- Provide hover actions (edit, delete, move, complete)

**Key Props:**
- `task: TaskDto` - Task data (id, title, description, originColor)
- `isSelected: boolean` - Keyboard focus state
- `onSelect: () => void` - Callback when task receives focus
- `onEdit: () => void`
- `onDelete: () => void`
- `onMove: () => void`
- `onComplete: () => void`

**Child Components:**
- `<TaskColorIndicator>`
- `<TaskContent>`
- `<TaskActionsMenu>` (on hover or when selected)

**Styling:**
- 4px left border in origin backlog color
- Selection ring when focused (ring-2 ring-offset-2)
- Hover state shows actions

**Accessibility:**
- Semantic `<li>` within list `<ul>`
- aria-selected when keyboard focused
- aria-label with full task details for screen readers

---

#### `<TaskEditForm>`
**Purpose:** Inline editable form for task title and description
**Responsibilities:**
- Replace task row when editing
- Provide title and description input fields
- Validate input (title required, max lengths)
- Submit on Enter, cancel on Esc

**Key Props:**
- `task: TaskDto` - Existing task data
- `onSave: (title: string, description?: string) => void`
- `onCancel: () => void`

**Form Fields:**
- Title input (autofocused, required, max 500 chars)
- Description textarea (optional, max 5000 chars)

**Validation:**
- react-hook-form + zod
- Inline errors on blur

**Accessibility:**
- Labels associated with inputs
- Error messages with aria-describedby

---

#### `<CurrentTaskCard>` (Work Mode)
**Purpose:** Prominent display of current task in Work Mode
**Responsibilities:**
- Show full task title and description (not truncated)
- Display origin backlog color and name
- Provide Complete action

**Key Props:**
- `task: TaskDto`
- `onComplete: () => void`

**Child Components:**
- `<TaskColorIndicator>` (larger/more prominent)
- `<TaskTitle>` (large, bold font)
- `<TaskDescription>` (full text, readable size)
- `<CompleteButton>`

**Styling:**
- Large card (centered, max-width for readability)
- Ample padding and spacing
- Complete button bottom-right

**Accessibility:**
- Task as `<main>` or `<article>`
- Complete button auto-focused on view load

---

### 5.4 Navigation Components

#### `<ModeSwitcher>`
**Purpose:** Tab/segmented control for switching between Plan, Work, Done
**Responsibilities:**
- Highlight current mode
- Navigate to mode route on click
- Show keyboard shortcuts on hover (tooltips)

**Key Props:**
- `currentMode: 'plan' | 'work' | 'done'`
- `onModeChange: (mode) => void` - Callback for navigation

**Child Components:**
- `<ModeTab>` (for each mode)

**Accessibility:**
- ARIA tablist pattern
- aria-current on active tab
- Keyboard navigation via arrow keys

---

#### `<CommandPalette>`
**Purpose:** Keyboard-driven action search (shadcn/ui Command component)
**Responsibilities:**
- Provide searchable list of actions
- Filter actions based on user input
- Execute action on selection

**Key Props:**
- `isOpen: boolean`
- `onClose: () => void`

**Actions List:**
- Navigation (Plan, Work, Done modes)
- Task actions (Create, Complete)
- List actions (Create, Toggle Backlog)
- Help (Show Shortcuts, Open Dump Mode)

**Accessibility:**
- ARIA combobox pattern
- aria-live region for results
- Keyboard navigation (↑↓ to select, Enter to execute)

---

#### `<KeyboardHelpModal>`
**Purpose:** Display categorized keyboard shortcuts
**Responsibilities:**
- Show all shortcuts organized by context
- Provide search/filter functionality
- Dismiss on Esc or close button

**Key Props:**
- `isOpen: boolean`
- `onClose: () => void`

**Content:**
- Global Shortcuts section
- Plan Mode Shortcuts section
- Work Mode Shortcuts section
- Search input (filters shortcuts)

**Accessibility:**
- ARIA dialog pattern
- Focus trap within modal
- Close button and Esc to dismiss

---

### 5.5 Form Components

#### `<DumpModeForm>`
**Purpose:** Multi-line task creation form
**Responsibilities:**
- Validate max 10 lines
- Remove blank lines on submit
- Remember last used backlog
- Submit tasks to backend

**Key Props:**
- `onSubmit: (lines: string[], targetListId: string) => void`
- `onCancel: () => void`

**Form Fields:**
- `<Textarea>` - Multi-line input (autofocused, max 10 lines)
- `<BacklogSelector>` - Dropdown for target backlog

**Validation:**
- Max 10 non-empty lines
- Disable submit if >10 lines
- Real-time line counter

**Accessibility:**
- Labels for textarea and dropdown
- Error messages announced to screen readers

---

### 5.6 Display Components

#### `<MetricsHeader>` (Done Archive)
**Purpose:** Display completion metrics summary
**Responsibilities:**
- Show today's, this week's, and last week's task counts
- Fetch metrics from API on mount

**Key Props:**
- None (fetches data internally via TanStack Query)

**Data Fetching:**
- `useMetricsQuery()` custom hook
- Displays loading skeleton while fetching

**Styling:**
- Compact horizontal bar
- Separated with bullet points (•)
- Subtle timezone indicator

**Accessibility:**
- Semantic text (e.g., "Today: 8 tasks")
- Metrics announced to screen readers

---

#### `<CompletedTaskCard>` (Done Archive)
**Purpose:** Read-only display of completed task
**Responsibilities:**
- Show task title, description, completion timestamp, origin color
- Display relative time for recent completions, absolute for older

**Key Props:**
- `task: TaskDto` - Task with completedAt timestamp

**Child Components:**
- `<TaskColorIndicator>`
- `<TaskTitle>`
- `<TaskDescription>` (if present)
- `<CompletionTimestamp>`

**Styling:**
- Similar to TaskRow but read-only (no hover actions)
- 4px left border in origin color

**Accessibility:**
- Semantic `<li>` within list `<ul>`
- Timestamp in human-readable format

---

#### `<PaginationControls>`
**Purpose:** Navigate between pages in Done Archive
**Responsibilities:**
- Show current page, total pages, and results count
- Provide Previous/Next and page number buttons

**Key Props:**
- `currentPage: number`
- `totalPages: number`
- `totalItems: number`
- `itemsPerPage: number`
- `onPageChange: (page: number) => void`

**Child Components:**
- `<PageButton>` (for each page number)
- `<PrevButton>`, `<NextButton>`
- `<ResultsCount>` (e.g., "Showing 1-50 of 237")

**Accessibility:**
- ARIA navigation pattern
- aria-current="page" on current page button
- Disabled state for Prev/Next at boundaries

---

### 5.7 State Management Components

#### `<KeyboardNavigationProvider>`
**Purpose:** React Context for keyboard navigation state
**Responsibilities:**
- Track selected list and task IDs
- Persist selection in sessionStorage
- Provide callbacks for updating selection

**Context Value:**
```typescript
{
  selectedListId: string | null;
  selectedTaskId: string | null;
  focusMode: 'list' | 'task';
  selectList: (listId: string) => void;
  selectTask: (taskId: string) => void;
  setFocusMode: (mode: 'list' | 'task') => void;
  clearSelection: () => void;
}
```

**Usage:**
- Wrap entire app in provider
- Consume in Plan Mode components for focus management

---

#### `<QueryClientProvider>` (TanStack Query)
**Purpose:** Global state management for server data
**Responsibilities:**
- Cache API responses
- Handle optimistic updates and rollbacks
- Invalidate queries on mutations

**Configuration:**
- Default stale time: 5 minutes
- Retry failed queries 3 times
- Refetch on window focus (for long-idle sessions)

**Custom Hooks:**
- `useListsQuery()` - Fetch all lists
- `useTasksQuery(listId?)` - Fetch tasks (optionally filtered by list)
- `useCreateTaskMutation()` - Create task with cache invalidation
- `useCompleteTaskMutation()` - Complete task with optimistic update
- `useDoneQuery(page)` - Fetch paginated completed tasks
- `useMetricsQuery()` - Fetch daily/weekly metrics

---

### 5.8 Utility Components

#### `<ErrorBoundary>`
**Purpose:** Catch React errors and display fallback UI
**Responsibilities:**
- Catch errors in component tree
- Display error message with recovery options
- Log errors to console (or error tracking service)

**Key Props:**
- `fallback: ReactNode` - UI to display on error

**Fallback UI:**
- Error message: "Something went wrong"
- Reload button
- Home button (navigate to Plan Mode)

**Accessibility:**
- Error message announced to screen readers
- Focus on reload button

---

#### `<LoadingSpinner>`
**Purpose:** Visual loading indicator
**Responsibilities:**
- Display animated spinner or skeleton
- Indicate loading state without blocking UI

**Variants:**
- Full-page skeleton (initial app load)
- Inline spinner (button loading states)
- Section skeleton (list/task loading)

**Accessibility:**
- aria-live="polite" for screen readers
- aria-busy="true" on loading container

---

#### `<EmptyState>`
**Purpose:** Placeholder when no data available
**Responsibilities:**
- Display contextual message (e.g., "No tasks in this list")
- Provide relevant actions (e.g., "Create Task" button)

**Variants:**
- Empty list (in Plan Mode)
- Empty work mode (no tasks in active list)
- Empty done archive (no completed tasks yet)

**Accessibility:**
- Semantic text explaining empty state
- Action buttons clearly labeled

---

## Summary

This UI architecture provides a comprehensive blueprint for implementing the GSD productivity application. The design prioritizes:

1. **Keyboard-first interaction** with progressive disclosure (focused Work Mode, full Plan Mode)
2. **Responsive design** adapting from desktop multi-column to mobile single-column with swipe navigation
3. **Accessibility** through semantic HTML, ARIA attributes, focus management, and screen reader support
4. **Performance** via optimistic updates, TanStack Query caching, and tiered loading states
5. **User experience** with inline editing, contextual help, clear limit enforcement, and graceful error handling

All user stories from the PRD are mapped to specific UI elements and user flows. The architecture is fully compatible with the API specification, with each endpoint serving a clear UI interaction. The component structure is modular, reusable, and aligned with React best practices and shadcn/ui patterns.

The implementation is ready to proceed in phases, starting with the authenticated shell and API client, followed by Plan Mode core, Work Mode, Done Archive, and additional features (Dump Mode, Command Palette, Help). Mobile responsiveness and final polish will complete the MVP.
