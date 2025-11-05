# MVP UI Architecture Plan - GSD (Getting Shit Done)

## 1. Overview

This document captures the UI architecture planning for the GSD MVP frontend. It documents key architectural decisions, component structure, routing strategy, state management approach, and user experience patterns based on the PRD and technical stack requirements.

**Planning Session Date:** 2025-11-05
**Status:** Approved for Implementation

**Key Objectives:**
- Define responsive UI architecture for Plan Mode, Work Mode, and Done View
- Establish keyboard-first interaction patterns
- Plan mobile-responsive layouts
- Design state management strategy
- Define component hierarchy and routing structure

---

## 2. Architectural Decisions Summary

### 2.1 View Architecture

**Decision:** Implement as a single authenticated shell with client-side view toggling.

**Rationale:**
- Mount a React app at `/app/*` that handles all three modes as routed views (`/app/plan`, `/app/work`, `/app/done`)
- Allows for faster transitions between modes
- Shared state via TanStack Query
- Better keyboard shortcut handling across modes
- Eliminates page reloads between mode switches

**Implementation:**
- Astro pages for landing/auth/static content
- React SPA for authenticated app shell
- Client-side routing within React app

---

### 2.2 Plan Mode Layout

**Decision:** Two-column cross-scroll layout with fixed backlog column

**Layout Structure:**
- **Left column (fixed 280px desktop, 240px tablet):** Backlogs stacked vertically with independent scroll
- **Right area (horizontal scroll):** Intermediate lists in columns (280px each)
- Both areas support independent scrolling (vertical for backlogs, horizontal for intermediate lists)

**Mobile Approach:**
- One list at a time (full viewport width)
- Header dropdown for backlog/list selection
- Horizontal swipe gestures for navigation between sibling lists
- Visual indicator showing current position

**Rationale:**
- Emphasizes left-to-right workflow (backlogs → intermediate → done)
- Backlogs grouped in single zone without forcing cross-backlog priority
- Fixed width prevents layout shifts
- Supports keyboard navigation naturally

**Component Hierarchy:**
```
<BoardLayout>
  <BacklogColumn>
    <BacklogList id="backlog-1" />
    <BacklogList id="backlog-2" />
  </BacklogColumn>
  <IntermediateListsContainer>
    <List id="week" />
    <List id="today" />
  </IntermediateListsContainer>
</BoardLayout>
```

---

### 2.3 Task Creation & Editing UX

**Decision:** Inline editing with keyboard-first flow

**Task Creation:**
- Press `n` (new) or `Enter` on empty selection
- Inline editable row appears at top of selected list
- Fields: title (autofocused) + expandable description
- `Enter` to save, `Esc` to cancel
- No modal interruptions

**Task Editing:**
- Press `e` (edit) or `Enter` on selected task
- Task row expands to show title and description fields
- `Tab` to move between fields
- `Enter` to save, `Esc` to cancel

**Rationale:**
- Maintains keyboard flow
- Reduces context switching
- Mirrors spreadsheet-like UX familiar to users
- Fast operation for power users

---

### 2.4 Dump Mode

**Decision:** Modal overlay triggered by global keyboard shortcut

**Interaction:**
- Global shortcut: `Cmd+Shift+D` from any view
- Modal shows textarea (max 10 lines)
- Backlog selector dropdown
- "Add to [Backlog Name]" button
- `Esc` to cancel

**Rationale:**
- Keeps user in current context
- Accessible from any mode
- Fast task capture without navigation
- Non-intrusive overlay pattern

---

### 2.5 Task Visual Origin (Color)

**Decision:** 4px left border with origin backlog color

**Implementation:**
- Task inherits color from origin backlog (assigned by backend)
- 4px left border on desktop
- 3px left border on mobile
- Color persists when task moves to intermediate lists or Done
- Provides visual tracing without overwhelming interface

**Note:** Backend assigns colors automatically on backlog creation (no MVP customization)

---

### 2.6 Work Mode

**Decision:** Read-only focused view with minimal actions

**Layout:**
- Current task displayed prominently (full width, large text)
- Read-only forecast showing next 2-3 tasks (smaller, below current)
- Single action button: "Complete" (or keyboard shortcut)
- Prominent "Switch to Plan Mode" button if reordering needed

**Empty State:**
- Message: "No tasks in [List Name]"
- Actions: "Switch to Plan Mode" (`p`) and "Add Task" (`n`)

**Rationale:**
- Maintains distraction-free focus
- Clear separation between planning and execution
- Prevents mode confusion
- Post-MVP: consider quick reordering in forecast

---

### 2.7 Metrics Display

**Decision:** Contextual display in Done View only (MVP)

**Implementation:**
- Header section in Done View: "Today: X tasks • This week: Y tasks • Last week: Z tasks"
- Fetch via TanStack Query
- Cache metrics data
- No separate metrics dashboard in MVP

**Rationale:**
- Simpler implementation
- Naturally fits completion-focused context
- Avoids cluttering Plan Mode
- Extensible to dedicated metrics view post-MVP

---

### 2.8 Limit Enforcement UX

**Decision:** Persistent non-intrusive indicators with disabled controls

**Implementation:**
- Show limit indicators: "8/10 lists" in header, "95/100 tasks" in list title
- Yellow highlight at 80% capacity
- Red highlight at 100% capacity
- Disable "Create" buttons at limit
- Tooltip on hover explaining constraint

**Rationale:**
- Transparent without being alarming
- Clear feedback before limit reached
- Prevents user frustration
- Aligns with PRD requirement (no toasts/complex UX)

---

### 2.9 Authentication Landing Page

**Decision:** Minimal static Astro page

**Structure:**
- App name/logo
- One-sentence tagline: "Plan and execute work using backlogs, lists, and focused work mode"
- Centered "Sign in with Google" button
- Footer with Privacy/Terms links
- No marketing content or hero images (MVP)

**Redirect:**
- Authenticated users redirect to `/app/plan` (or last saved mode post-MVP)
- Use Astro middleware for redirect logic

**Rationale:**
- Fast initial load (static generation)
- Simple, focused, professional
- SEO-friendly
- Easy to enhance post-MVP

---

### 2.10 Keyboard Shortcuts Organization

**Decision:** Categorized help overlay with search

**Structure:**
- Modal triggered by `?`
- Categories:
  - Global shortcuts (mode switching, help)
  - Plan Mode shortcuts (navigation, task/list operations)
  - Work Mode shortcuts (complete, add task)
- Two-column layout on desktop, single column on mobile
- Search filter at top for quick discovery

**Rationale:**
- Organizes shortcuts by context
- Searchable for quick reference
- Scalable as shortcuts grow
- Reduces cognitive load

---

## 3. Component Architecture

### 3.1 Route Structure

```
/                           → Landing page (Astro static)
/auth/callback              → OAuth callback handler (Astro)
/privacy                    → Privacy policy (Astro static)
/terms                      → Terms of service (Astro static)

/app                        → Authenticated shell (React SPA root)
  ├─ /app/plan              → Plan Mode
  ├─ /app/work              → Work Mode
  └─ /app/done              → Done Archive
```

**Authentication:**
- Astro middleware checks JWT cookie
- Redirects unauthenticated users to `/`
- Redirects authenticated users from `/` to `/app/plan`

---

### 3.2 Component Library Strategy

**Use shadcn/ui for:**
- Buttons
- Inputs (text, textarea)
- Dialogs/Modals
- Dropdowns/Select
- Command palette (cmdk)
- Tooltips
- Skeleton loaders

**Build custom components for:**
- List board layout (BacklogColumn, IntermediateListsContainer)
- Task card/row
- Keyboard navigation grid
- Work mode focused view
- Backlog column (vertical scroll)
- Mobile swipe container

**Rationale:**
- Leverage shadcn/ui for consistency and accessibility
- Custom components for domain-specific UX
- Tailwind CSS for styling both
- Balance between reuse and specificity

---

### 3.3 State Management

**Decision:** Centralized API client + TanStack Query hooks

**Structure:**
```
apps/frontend/src/
├── lib/
│   └── api/
│       ├── client.ts           # Base fetch wrapper
│       ├── lists.ts            # Lists API functions
│       ├── tasks.ts            # Tasks API functions
│       ├── done.ts             # Done API functions
│       └── metrics.ts          # Metrics API functions
├── hooks/
│   ├── use-lists.ts            # useListsQuery, useCreateListMutation
│   ├── use-tasks.ts            # useTasksQuery, useCreateTaskMutation
│   ├── use-done.ts             # useDoneQuery
│   └── use-metrics.ts          # useMetricsQuery
└── components/
    └── ...
```

**Query Keys Convention:**
```typescript
// Lists
['lists', userId]
['lists', listId]

// Tasks
['tasks', { listId, userId }]
['tasks', taskId]

// Done
['done', { page, userId }]

// Metrics
['metrics', 'daily', { userId }]
['metrics', 'weekly', { userId }]
```

**Rationale:**
- Single source of truth for queries
- Clean component code
- Automatic caching and refetching
- Optimistic updates support
- Type-safe with shared DTOs from `@gsd/types`

---

### 3.4 Optimistic Updates Strategy

**Apply optimistic updates for:**
- ✅ Task completion (high confidence, fast feedback)
- ✅ Task reordering (visual feedback critical)
- ✅ Task movement between lists (visual operation)
- ✅ List reordering (visual operation)

**Do NOT use optimistic updates for:**
- ❌ Task/list creation (need server-assigned IDs)
- ❌ Task/list deletion (risky if fails, user expects confirmation)
- ❌ Toggle backlog status (affects business rules/constraints)

**Rationale:**
- Balance responsiveness with data integrity
- Optimistic for operations with low failure risk
- Pessimistic for operations with business rules
- Clear rollback on failure

---

### 3.5 Loading States

**Tiered approach:**

1. **Initial page load:** Full-page skeleton with list column placeholders
2. **List operations:** Inline spinner on affected list header
3. **Task operations:** Inline spinner on task row
4. **Mode switching:** Instant (no loader, cached data)

**Never:**
- Block entire UI for single operations
- Use full-page spinners except initial load

**React Suspense:**
- Code-splitting boundaries for routes
- Lazy load non-critical components

**Rationale:**
- Progressive loading reduces perceived latency
- Contextual feedback keeps user oriented
- Suspense for code-splitting improves initial load

---

### 3.6 Error Handling

**Error Classification:**

| HTTP Status | Type           | UI Response                            |
| ----------- | -------------- | -------------------------------------- |
| 401/403     | Authentication | Redirect to login, clear local state  |
| 400/422     | Validation     | Inline error below affected field      |
| 429         | Rate Limit     | Toast: "Too many requests, try again"  |
| 500+        | Server Error   | Inline: "Something went wrong, retry?" |
| Network     | Offline        | Toast: "Connection lost"               |

**Implementation:**
- Error utility: `classifyError(error) => ErrorType`
- TanStack Query `onError` callback at query level
- Component-level overrides for specific messages
- Retry button for recoverable errors

**Rationale:**
- Consistent error handling across app
- User-friendly messages
- Clear recovery paths
- Aligns with PRD (inline errors, no complex flows)

---

### 3.7 Keyboard Navigation State

**Decision:** React context for keyboard selection state

**Context Structure:**
```typescript
interface KeyboardNavigationContext {
  selectedListId: string | null;
  selectedTaskId: string | null;
  focusMode: 'list' | 'task';
  selectList: (listId: string) => void;
  selectTask: (taskId: string) => void;
  setFocusMode: (mode: 'list' | 'task') => void;
}
```

**Persistence:**
- Store selection in `sessionStorage`
- Restore on component mount
- Survives React re-renders

**Arrow Key Handlers:**
- Attached at board level
- Update context based on current selection
- Visual indicators rendered via context consumers

**Rationale:**
- Centralized keyboard state
- Decoupled from list/task data
- Easy to test
- Persists across navigation

---

### 3.8 Mobile Navigation

**Decision:** Swipeable container with header selector

**Implementation:**
- Use `react-swipeable-views` or similar
- One list per viewport width
- Header shows current list name + dropdown selector
- Dots/indicators showing position in list sequence
- Disable browser back/forward swipe gestures

**Fallback:**
- CSS `scroll-snap` for better browser compatibility
- `overflow-x: scroll` with snap points

**Rationale:**
- Native mobile UX pattern
- Works with touch gestures
- Clear position indication
- Prevents gesture conflicts

---

### 3.9 Command Palette

**Decision:** shadcn/ui command component (cmdk)

**Trigger:** `Cmd+K` or `Ctrl+K`

**Actions:**
- "Switch to Plan Mode" (`Cmd+P`)
- "Switch to Work Mode" (`Cmd+W`)
- "Go to Done" (`Cmd+D`)
- "Create Task" (`n`)
- "Create List" (`l`)
- "Toggle Dump Mode" (`Cmd+Shift+D`)
- "Show Keyboard Help" (`?`)

**Display:**
- Action name
- Keyboard shortcut hint (right-aligned)
- Icon (lucide-react)
- Search filter at top

**Rationale:**
- Discoverability for keyboard shortcuts
- Fast action access for mouse users
- Standard pattern (GitHub, Linear, etc.)
- Extensible for future actions

---

### 3.10 Form Validation

**Decision:** react-hook-form + zod in "onBlur" mode

**Task/List Forms:**
- Validate on blur (immediate feedback without distraction)
- Inline error messages below input
- Error persists until corrected

**Dump Mode:**
- Validate on submit only
- Check line count ≤ 10
- Show error if exceeded

**Validation Rules:**
- Task title: required, 1-200 chars
- Task description: optional, max 1000 chars
- List name: required, 1-100 chars
- Dump mode: max 10 non-empty lines

**Rationale:**
- Balance feedback with UX
- No interruption during typing
- Immediate feedback on blur
- Aligns with keyboard-first workflow

---

## 4. Implementation Questions & Decisions

### Q1: View Hierarchy and Organization

**Question:** Should Plan Mode, Work Mode, and Done View be implemented as separate Astro pages or a single authenticated shell with client-side view toggling?

**Decision:** Single authenticated shell with client-side view toggling (React SPA at `/app/*`)

**Approved:** ✅

---

### Q2: Backlog Visualization

**Question:** How should multiple backlogs be visually distinguished from intermediate lists in Plan Mode?

**Decision:** Two-column layout - fixed-width left panel for backlogs (stacked vertically), scrollable right container for intermediate lists (horizontal scroll). Distinct background/borders for backlog zone.

**Approved:** ✅

---

### Q3: Navigation Persistence

**Question:** Should the application remember the user's last active mode and list selection between sessions?

**Decision:** Yes, persist in localStorage. Restore on app load. Post-MVP feature (documented in project tracker).

**Approved:** ✅ (Nice to have, post-MVP)

---

### Q4: Keyboard Shortcut Scope

**Question:** Should keyboard shortcuts work globally or be mode-specific?

**Decision:** Hybrid approach - global shortcuts for mode switching (`Cmd+P`, `Cmd+W`, `?`) + mode-specific shortcuts (arrow navigation in Plan, `Space`/`Enter` complete in Work). Command palette (`Cmd+K`) for discoverability.

**Approved:** ✅

---

### Q5: Mobile List Navigation

**Question:** For mobile one-list-at-a-time view, how should backlogs be navigable?

**Decision:** Two-tier: header dropdown for selecting backlog/intermediate list + horizontal swipe for navigating between sibling lists.

**Approved:** ✅

---

### Q6: Work Mode Forecast

**Question:** Should the Work Mode forecast be read-only or allow editing?

**Decision:** Strictly read-only in MVP. Include "Switch to Plan Mode" button for adjustments. Post-MVP: consider allowing quick reordering of forecast tasks.

**Approved:** ✅ (Read-only)

---

### Q7: Error State Presentation

**Question:** How should API operation failures be displayed?

**Decision:** Inline errors for form validation and context-specific failures. Minimal toast system (bottom-right, auto-dismiss) only for critical system errors. Never block UI with modal error dialogs.

**Approved:** ✅

---

### Q8: Metrics Display Location

**Question:** Where should daily/weekly completion metrics be displayed?

**Decision:** Display only in Done View as header section ("Today: X • This week: Y • Last week: Z"). Simpler than integrating into Plan Mode.

**Approved:** ✅

---

### Q9: List Limit Enforcement

**Question:** How should the UI communicate list/task limits beyond disabling controls?

**Decision:** Persistent limit indicators ("8/10 lists") with color coding (yellow at 80%, red at 100%). Disabled buttons with explanatory tooltips.

**Approved:** ✅

---

### Q10: Authentication Landing Page

**Question:** What should the pre-authentication landing page contain?

**Decision:** Minimal Astro page: logo + tagline + "Sign in with Google" button + footer links. No marketing content.

**Approved:** ✅

---

### Q11: Task Creation UX

**Question:** Should task creation use inline input or dedicated form/modal?

**Decision:** Inline editable row at top of list (triggered by `n` or `Enter`). Title + expandable description. `Enter` to save, `Esc` to cancel.

**Approved:** ✅

---

### Q12: Dump Mode Access

**Question:** Should Dump Mode be a separate route, modal overlay, or slide-out panel?

**Decision:** Modal overlay triggered by `Cmd+Shift+D` from any view. Textarea (max 10 lines) + backlog selector + "Add" button.

**Approved:** ✅

---

### Q13: Task Color Inheritance

**Question:** How should task origin backlog color be displayed?

**Decision:** 4px left border (3px on mobile) with origin backlog color. Color persists across moves.

**Approved:** ✅

---

### Q14: Backlog Color Assignment

**Question:** Should backlog colors be customizable or auto-assigned?

**Decision:** Auto-assigned by backend from predefined 10-color palette. No MVP customization. Backend logic already exists.

**Approved:** ✅

---

### Q15: Plan Mode Layout Dimensions

**Question:** Should the backlog column be fixed-width or flexible?

**Decision:** Fixed width - 280px desktop, 240px tablet. Intermediate lists same width (280px each).

**Approved:** ✅

---

### Q16: Task Editing Flow

**Question:** Should task editing happen inline or require entering "edit mode"?

**Decision:** Inline editing triggered by `e` or `Enter`. Row expands to show fields. `Tab` between fields, `Enter` to save, `Esc` to cancel.

**Approved:** ✅

---

### Q17: Work Mode Empty State

**Question:** What should Work Mode display when active list has no tasks?

**Decision:** Centered message: "No tasks in [List Name]" + actions: "Switch to Plan Mode" (`p`) and "Add Task" (`n`).

**Approved:** ✅

---

### Q18: Done View Metrics Integration

**Question:** Done View metrics or separate dashboard?

**Decision:** Metrics only in Done View (simpler). Header section with today/this week/last week counts.

**Approved:** ✅

---

### Q19: Authentication Landing Page Details

**Question:** What's the simplest authentication landing page approach?

**Decision:** Minimal static page: app name + one-sentence tagline + centered Google sign-in button + footer links.

**Approved:** ✅

---

### Q20: Keyboard Shortcuts Help Overlay

**Question:** Should help overlay show all shortcuts or organize by category?

**Decision:** Organized by category (Global, Plan Mode, Work Mode). Two-column desktop, single-column mobile. Search filter at top.

**Approved:** ✅

---

### Q21: State Management Structure

**Question:** How should TanStack Query be organized?

**Decision:** Centralized API client in `lib/api/` (lists, tasks, done, metrics modules) + custom hooks in `hooks/` wrapping TanStack Query.

**Approved:** ✅

---

### Q22: Optimistic Updates

**Question:** Which actions should have optimistic UI updates?

**Decision:** Apply for: task completion, task reordering, task movement, list reordering. Do NOT use for: creation (need IDs), deletion (risky), toggle backlog (business rules).

**Approved:** ✅

---

### Q23: Loading States

**Question:** Global spinner, per-list skeleton, or per-operation inline?

**Decision:** Tiered: (1) Initial load = full-page skeleton, (2) List operations = inline spinner on list header, (3) Task operations = inline spinner on task row. Never block entire UI.

**Approved:** ✅

---

### Q24: Route Structure

**Question:** What should be the exact route hierarchy?

**Decision:**
- `/` - Landing (Astro static)
- `/auth/callback` - OAuth callback (Astro)
- `/app` - Authenticated shell → redirects to `/app/plan`
- `/app/plan`, `/app/work`, `/app/done` - React SPA routes
- `/privacy`, `/terms` - Static pages

**Approved:** ✅

---

### Q25: Component Library Usage

**Question:** Should all components use shadcn/ui or some be custom?

**Decision:** shadcn/ui for: buttons, inputs, dialogs, dropdowns, command, tooltips. Custom for: board layout, task cards, keyboard nav grid, work mode view.

**Approved:** ✅

---

### Q26: Keyboard Navigation State Management

**Question:** How should keyboard focus and selection be managed?

**Decision:** React context (`KeyboardNavigationContext`) tracking: selected list ID, selected task ID, focus mode. Arrow handlers at board level. Persist in sessionStorage.

**Approved:** ✅

---

### Q27: API Error Handling

**Question:** How to distinguish error types and display them?

**Decision:** Error classification utility mapping status codes to types: 401/403→login redirect, 400/422→inline validation, 429→rate limit toast, 500+→generic error. TanStack Query `onError` for global handling.

**Approved:** ✅

---

### Q28: Mobile Navigation Pattern

**Question:** Should mobile swipe work at viewport or within scrollable container?

**Decision:** Swipeable container (react-swipeable-views) rendering one list at full viewport width. Header with selector + position indicators. Disable browser swipe gestures. CSS scroll-snap as fallback.

**Approved:** ✅

---

### Q29: Command Palette Implementation

**Question:** Should command palette use shadcn/ui's command component?

**Decision:** Yes, use shadcn/ui command (cmdk). Pre-populate with mode switching, task/list creation, dump mode, help. Include shortcut hints.

**Approved:** ✅

---

### Q30: Form Validation Strategy

**Question:** Validation on blur, change, or submit?

**Decision:** react-hook-form + zod in "onBlur" mode for task/list forms (immediate feedback without interruption). Dump mode validates on submit only (line count check).

**Approved:** ✅

---

## 5. Technology Stack Confirmation

### Frontend Dependencies

**Core:**
- Astro (islands architecture)
- React 19
- TypeScript (strict mode)

**Styling:**
- Tailwind CSS
- shadcn/ui components
- lucide-react icons

**State Management:**
- TanStack Query (server state)
- React Context (keyboard navigation, auth)
- Local state (useState)

**Forms:**
- react-hook-form
- zod (validation)

**Routing:**
- Astro pages (static/auth)
- React Router or client-side routing (within `/app/*`)

**API Client:**
- Custom fetch wrapper with typed DTOs
- Optional: OpenAPI client generation from backend Swagger

**Mobile:**
- react-swipeable-views (or similar)
- CSS scroll-snap (fallback)

---

## 6. Next Steps

### Phase 1: Foundation (Week 1)
- [ ] Set up authenticated React app shell at `/app`
- [ ] Implement API client wrapper (`lib/api/client.ts`)
- [ ] Create TanStack Query hooks for lists and tasks
- [ ] Build basic layout components (AppShell, Header, Navigation)
- [ ] Implement keyboard navigation context

### Phase 2: Plan Mode Core (Week 2-3)
- [ ] Build board layout (BacklogColumn + IntermediateListsContainer)
- [ ] Implement list components (List, ListHeader, TaskCard)
- [ ] Add inline task creation/editing
- [ ] Wire up list CRUD operations
- [ ] Implement task CRUD operations
- [ ] Add keyboard navigation (arrow keys + vim keys)

### Phase 3: Work Mode & Done (Week 4)
- [ ] Build Work Mode focused view
- [ ] Implement task completion flow
- [ ] Create Done archive view with pagination
- [ ] Add metrics display to Done view
- [ ] Implement empty states

### Phase 4: Additional Features (Week 5)
- [ ] Add Dump Mode modal
- [ ] Implement command palette (Cmd+K)
- [ ] Create keyboard shortcuts help overlay (?)
- [ ] Add limit enforcement indicators
- [ ] Implement error handling UI

### Phase 5: Mobile Responsive (Week 6)
- [ ] Implement mobile layout (one list at a time)
- [ ] Add swipeable navigation
- [ ] Create mobile list selector dropdown
- [ ] Optimize touch interactions
- [ ] Test on mobile devices

### Phase 6: Polish & Testing (Week 7)
- [ ] Add loading states (skeletons, spinners)
- [ ] Implement optimistic updates
- [ ] Refine error messages
- [ ] Add animations/transitions
- [ ] Write component tests
- [ ] E2E testing
- [ ] Performance optimization

---

## 7. Open Questions (To Be Resolved During Implementation)

1. **Task virtualization:** Do we need virtual scrolling for 100-task lists, or is DOM performance acceptable?
   - **Decision pending:** Test with 100 tasks, add virtualization if needed

2. **Keyboard shortcut conflicts:** How to handle browser shortcuts (Cmd+W closes window)?
   - **Decision pending:** Document conflicts, consider alternative shortcuts

3. **Animation library:** Do we need framer-motion or are CSS transitions sufficient?
   - **Decision pending:** Start with CSS, add framer-motion if complex animations needed

4. **Offline handling:** Should we show offline indicator even though offline mode is out of scope?
   - **Decision pending:** Consider basic offline detection for better UX

5. **Dark mode:** Should we add dark mode toggle in MVP or defer to post-MVP?
   - **Decision pending:** Defer to post-MVP unless trivial with Tailwind

---

## 8. Success Criteria

### Functional Requirements
- ✅ All three modes (Plan, Work, Done) functional and navigable
- ✅ Keyboard-first interaction working (arrow keys, vim keys, shortcuts)
- ✅ Mobile responsive (one list at a time, swipeable)
- ✅ CRUD operations for lists and tasks working
- ✅ Task completion flow working (move to Done)
- ✅ Limit enforcement visible and working
- ✅ Error handling inline and clear
- ✅ Google OAuth sign-in/out working

### Performance Targets
- Initial load (authenticated): < 2s (95th percentile)
- Mode switching: < 100ms
- Task operations: < 200ms (with optimistic updates)
- List operations: < 200ms
- Mobile swipe response: < 50ms

### Quality Metrics
- Zero critical bugs
- All user stories from PRD satisfied
- Responsive on desktop (1920x1080) and mobile (375x667)
- Keyboard navigation accessible
- Error states handled gracefully

---

## 9. References

- [Product Requirements Document](.ai/prd.md)
- [Technical Stack](.ai/tech-stack.md)
- [Project Tracker](.ai/project-tracker.md)
- [Backend Implementation Plans](.ai/)
- [CLAUDE.md Coding Standards](../CLAUDE.md)

---

**Document Status:** Approved for implementation
**Last Updated:** 2025-11-05
**Next Review:** After Phase 1 completion
