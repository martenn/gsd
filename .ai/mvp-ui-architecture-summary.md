# MVP UI Architecture Planning Summary - GSD

**Document Date:** 2025-11-05
**Status:** Approved for Implementation
**Purpose:** Comprehensive summary of UI architecture decisions for MVP development

---

<conversation_summary>

## Decisions

The following key architectural and UX decisions were made during the planning session:

1. **View Architecture:** Single authenticated React SPA shell at `/app/*` with client-side routing for Plan, Work, and Done modes
2. **Plan Mode Layout:** Two-column cross-scroll layout with fixed-width backlog column (280px desktop) and horizontal-scrollable intermediate lists
3. **Task Creation:** Inline editable row at top of list, triggered by `n` or `Enter`, with autofocus on title field
4. **Task Editing:** Inline editing triggered by `e` or `Enter`, expanding row to show title and description fields
5. **Dump Mode:** Modal overlay accessible via `Cmd+Shift+D` from any view, with textarea supporting max 10 lines
6. **Task Color Inheritance:** 4px left border (3px mobile) displaying origin backlog color that persists across moves
7. **Work Mode Design:** Read-only focused view showing current task prominently with 2-3 task forecast below
8. **Metrics Display:** Contextual display in Done View header only ("Today: X • This week: Y • Last week: Z")
9. **Limit Enforcement:** Persistent non-intrusive indicators with color coding (yellow at 80%, red at 100%) and disabled controls
10. **Authentication Landing:** Minimal static Astro page with logo, tagline, Google sign-in button, and footer links
11. **Keyboard Shortcuts:** Categorized help overlay triggered by `?`, organized by Global/Plan Mode/Work Mode with search filter
12. **State Management:** TanStack Query with centralized API client (`lib/api/`) and custom hooks (`hooks/`)
13. **Optimistic Updates:** Applied to task completion, reordering, movement, and list reordering; NOT for creation or deletion
14. **Loading States:** Tiered approach - full-page skeleton for initial load, inline spinners for operations
15. **Route Structure:** Astro static pages for landing/auth, React SPA for authenticated app at `/app/plan`, `/app/work`, `/app/done`
16. **Component Library:** shadcn/ui for standard components, custom components for domain-specific UX
17. **Keyboard Navigation:** React context (`KeyboardNavigationContext`) tracking selection state, persisted in sessionStorage
18. **Error Handling:** Classification utility mapping HTTP status codes to error types with appropriate UI responses
19. **Mobile Navigation:** Swipeable container showing one list at a time with header dropdown and position indicators
20. **Command Palette:** shadcn/ui command component (cmdk) triggered by `Cmd+K` with pre-populated actions
21. **Form Validation:** react-hook-form + zod in "onBlur" mode for task/list forms, submit validation for Dump Mode
22. **Backlog Color Assignment:** Auto-assigned by backend from predefined 10-color palette, no MVP customization
23. **Backlog Visualization:** Fixed-width left panel stacking backlogs vertically with distinct background/borders
24. **Navigation Persistence:** Persist last active mode and list selection in localStorage (post-MVP feature)
25. **Keyboard Scope:** Hybrid approach - global shortcuts for mode switching, mode-specific shortcuts for operations
26. **Mobile List Navigation:** Two-tier system with header dropdown for list selection and horizontal swipe for navigation
27. **Error Presentation:** Inline errors for validation, minimal toast system for critical errors only
28. **Work Mode Empty State:** Centered message with actions to switch to Plan Mode or add task
29. **API Structure:** Typed fetch wrapper with shared DTOs from `@gsd/types`, optional OpenAPI client generation
30. **Component Dimensions:** Fixed-width lists at 280px (desktop) and 240px (tablet) to prevent layout shifts

---

## Matched Recommendations

Based on the architectural decisions, the following recommendations align with the approved implementation plan:

1. **Islands Architecture with Hydration Boundaries**
   - Leverage Astro's islands architecture for static landing/auth pages
   - Mount React SPA only for authenticated routes to minimize client-side JavaScript
   - Use Astro middleware for authentication checks and redirects

2. **Keyboard-First Interaction Pattern**
   - Implement spreadsheet-like cell navigation with arrow keys as primary input
   - Provide vim-style h/j/k/l as alternates for power users
   - Create centralized keyboard event handler at board level with context propagation
   - Include command palette for discoverability and mouse-user accessibility

3. **Optimistic UI Updates with Rollback**
   - Apply selective optimistic updates for high-confidence operations (reordering, completion)
   - Implement TanStack Query's optimistic mutation callbacks
   - Ensure clear rollback strategies with error notifications on failure
   - Avoid optimistic updates for operations requiring server-assigned data (IDs)

4. **Mobile-First Responsive Design**
   - Single list viewport with swipeable navigation for mobile
   - Progressive enhancement from mobile to desktop layouts
   - Touch-friendly targets (minimum 44x44px) for mobile actions
   - CSS scroll-snap as fallback for browser compatibility

5. **Contextual Loading States**
   - Implement tiered loading: full skeleton → section spinners → inline indicators
   - Never block entire UI for localized operations
   - Use React Suspense for code-splitting and lazy loading
   - Maintain perceived performance through immediate UI feedback

6. **Error Boundary Strategy**
   - Classify errors by HTTP status and context
   - Implement error boundaries at route level for graceful degradation
   - Provide clear recovery paths (retry buttons, navigation options)
   - Avoid modal error dialogs in favor of inline contextual messages

7. **Accessible UI Components**
   - Leverage shadcn/ui components with built-in ARIA attributes
   - Implement proper focus management for keyboard navigation
   - Ensure keyboard shortcut help is discoverable via `?` overlay
   - Maintain logical tab order throughout application

8. **Type-Safe API Layer**
   - Share TypeScript interfaces via `@gsd/types` package
   - Implement backend DTOs with class-validator decorators
   - Use centralized API client with typed request/response DTOs
   - Consider OpenAPI client generation for automatic type synchronization

9. **Performance-Oriented State Management**
   - Use TanStack Query for server state with automatic caching
   - Implement normalized query keys for efficient cache invalidation
   - Keep UI state local to components when possible
   - Reserve React Context for cross-cutting concerns (auth, keyboard nav)

10. **Progressive Enhancement Pattern**
    - Start with semantic HTML and CSS-only interactions where possible
    - Layer JavaScript for enhanced interactivity
    - Ensure core functionality works without complex animations
    - Add framer-motion or similar only if CSS transitions insufficient

---

## UI Architecture Planning Summary

### Main UI Architecture Requirements

**Application Structure:**

- Astro-based static site generation for landing, authentication, and legal pages
- React 19 SPA mounted at `/app/*` for authenticated application shell
- Client-side routing within React app for instant mode switching
- Authenticated middleware enforcing JWT cookie validation

**Core Views:**

1. **Landing Page (Astro Static):** Minimal authentication entry point with Google OAuth
2. **Plan Mode (/app/plan):** Full task and list management with keyboard-first navigation
3. **Work Mode (/app/work):** Focused execution view with current task and forecast
4. **Done Archive (/app/done):** Paginated completed tasks with embedded metrics

**Design System:**

- Tailwind CSS for utility-first styling
- shadcn/ui for standard UI components (buttons, inputs, dialogs, dropdowns, command palette)
- lucide-react for iconography
- Custom components for domain-specific UX (board layout, task cards, keyboard navigation)

---

### Key Views, Screens, and User Flows

#### Plan Mode Layout

**Desktop Layout:**

- **Left Column (Fixed 280px):** Backlogs stacked vertically with independent vertical scroll
  - Distinct background/border to separate from intermediate lists
  - Each backlog displays as a full list with header and tasks
- **Right Area (Horizontal Scroll):** Intermediate lists rendered as 280px columns
  - Scroll horizontally to view all intermediate lists
  - Rightmost list is the active work list
  - Both areas support independent scrolling

**Mobile Layout:**

- One list at full viewport width
- Header dropdown for backlog/list selection
- Horizontal swipe gestures for navigation between sibling lists
- Visual indicators showing current position in list sequence

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

#### Task Management Flows

**Creating Tasks:**

1. User presses `n` (new) or `Enter` on empty selection
2. Inline editable row appears at top of selected list
3. Title field autofocused, description expandable
4. `Enter` to save, `Esc` to cancel
5. No modal interruptions

**Editing Tasks:**

1. User presses `e` (edit) or `Enter` on selected task
2. Task row expands to show title and description fields
3. `Tab` to move between fields
4. `Enter` to save, `Esc` to cancel
5. Inline validation on blur

**Moving Tasks:**

1. User selects task with arrow keys
2. User presses shortcut to move (TBD during implementation)
3. Task moves to top of destination list
4. Optimistic UI update with rollback on failure

**Completing Tasks:**

1. From any list: user selects task and presses complete shortcut
2. Task moves to Done with completed_at timestamp
3. Optimistic UI update with server confirmation

#### Work Mode Flow

**Main View:**

- Current task displayed prominently (large text, full width)
- Read-only forecast showing next 2-3 tasks (smaller, below current)
- Single action: "Complete" button (or keyboard shortcut)
- Prominent "Switch to Plan Mode" button if reordering needed

**Empty State:**

- Message: "No tasks in [List Name]"
- Actions: "Switch to Plan Mode" (`p`) and "Add Task" (`n`)

**Completion Flow:**

1. User presses Complete (or shortcut)
2. Current task moves to Done
3. Next task in forecast becomes current task
4. Forecast refreshes to show new next 2-3 tasks

#### Dump Mode Flow

**Access:**

1. User presses `Cmd+Shift+D` from any view
2. Modal overlay appears over current view

**Interaction:**

1. Textarea autofocused (max 10 lines)
2. Backlog selector dropdown (remembers last used)
3. User types or pastes multiple task titles (one per line)
4. Click "Add to [Backlog Name]" or press submit shortcut
5. Blank lines removed, duplicates allowed
6. Tasks created at top of selected backlog
7. Modal closes, user returns to previous view

#### Done Archive Flow

**Viewing:**

1. User navigates to Done view via mode switcher
2. Header shows metrics: "Today: X tasks • This week: Y tasks • Last week: Z tasks"
3. Completed tasks listed in reverse chronological order (newest first)
4. 50 tasks per page with pagination controls
5. Tasks display with origin backlog color (left border)

**Retention:**

- System automatically retains last 500 completed tasks per user
- Oldest tasks beyond 500 are automatically deleted
- Timestamps stored in UTC, rendered in user's local timezone

#### Navigation Flows

**Mode Switching (Global Shortcuts):**

- `Cmd+P` → Plan Mode
- `Cmd+W` → Work Mode
- `Cmd+D` → Done View
- `?` → Keyboard shortcuts help overlay
- `Cmd+K` → Command palette

**Keyboard Navigation (Plan Mode):**

- Arrow keys (↑↓←→) → Navigate between tasks and lists (primary)
- `h/j/k/l` → Vim-style alternates
- `n` → New task in selected list
- `e` or `Enter` → Edit selected task
- `l` → New list
- Selection state persisted in sessionStorage

**Mobile Navigation:**

- Swipe left/right → Navigate between adjacent lists
- Tap header → Open list selector dropdown
- Position indicators → Show current list in sequence

---

### API Integration and State Management Strategy

#### API Client Architecture

**Structure:**

```
apps/frontend/src/
├── lib/
│   └── api/
│       ├── client.ts           # Base fetch wrapper with auth/error handling
│       ├── lists.ts            # Lists API functions
│       ├── tasks.ts            # Tasks API functions
│       ├── done.ts             # Done API functions
│       └── metrics.ts          # Metrics API functions
```

**Base Client (`lib/api/client.ts`):**

- Fetch wrapper with automatic JWT cookie handling
- Global error interceptor for auth/network issues
- Response type validation against shared DTOs
- Request/response logging in development

**API Modules:**
Each module exports typed functions for API operations:

```typescript
// lib/api/lists.ts
export async function getLists(): Promise<GetListsResponseDto>;
export async function createList(req: CreateListRequest): Promise<ListDto>;
export async function updateList(id: string, req: UpdateListRequest): Promise<ListDto>;
export async function deleteList(id: string, destId?: string): Promise<void>;
export async function reorderLists(req: ReorderListsRequest): Promise<void>;
```

#### State Management with TanStack Query

**Query Keys Convention:**

```typescript
// Lists
['lists', userId][('lists', listId)][ // All lists for user // Single list detail
  // Tasks
  ('tasks', { listId, userId })
][('tasks', taskId)][ // Tasks filtered by list // Single task detail
  // Done
  ('done', { page, userId })
][ // Paginated done tasks
  // Metrics
  ('metrics', 'daily', { userId })
][('metrics', 'weekly', { userId })]; // Daily completion counts // Weekly completion counts
```

**Custom Hooks Structure:**

```
apps/frontend/src/hooks/
├── use-lists.ts            # useListsQuery, useCreateListMutation, etc.
├── use-tasks.ts            # useTasksQuery, useCreateTaskMutation, etc.
├── use-done.ts             # useDoneQuery
└── use-metrics.ts          # useMetricsQuery
```

**Example Hook Implementation:**

```typescript
// hooks/use-lists.ts
export function useListsQuery() {
  return useQuery({
    queryKey: ['lists', userId],
    queryFn: () => getLists(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateListMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateListRequest) => createList(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useReorderTasksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ReorderTasksRequest) => reorderTasks(req),
    onMutate: async (variables) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks', { listId }]);
      queryClient.setQueryData(['tasks', { listId }], (old) => {
        // Apply optimistic reordering
        return reorderOptimistically(old, variables);
      });
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks', { listId }], context.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

#### Optimistic Updates Strategy

**Apply Optimistic Updates For:**

- ✅ Task completion (high confidence, fast feedback critical)
- ✅ Task reordering within list (visual operation, reversible)
- ✅ Task movement between lists (visual operation, clear intent)
- ✅ List reordering (visual operation, low risk)

**DO NOT Use Optimistic Updates For:**

- ❌ Task/list creation (need server-assigned IDs and validation)
- ❌ Task/list deletion (risky if fails, user expects confirmation)
- ❌ Toggle backlog status (affects business rules and constraints)
- ❌ Dump mode bulk creation (multiple validations, error handling complex)

**Rollback Strategy:**

- Store previous query data in mutation context
- On error, restore previous data via `setQueryData`
- Display inline error message near affected element
- Offer retry button for user-initiated recovery

#### Additional State Management

**Keyboard Navigation State (React Context):**

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

- Persisted in sessionStorage
- Restored on component mount
- Independent of server data

**Authentication State:**

- JWT stored in HttpOnly cookie (managed by backend)
- User info fetched on app load and cached
- Logout clears cookie and invalidates all queries

**Local UI State:**

- Modal open/closed states (useState)
- Form field values (react-hook-form)
- Transient UI interactions (hover, focus)

---

### Responsiveness, Accessibility, and Security Considerations

#### Responsiveness

**Breakpoints (Tailwind CSS):**

- Mobile: < 768px (one list at a time, swipeable)
- Tablet: 768px - 1024px (narrower columns, 240px lists)
- Desktop: ≥ 1024px (full layout, 280px lists)

**Mobile Optimizations:**

- Touch targets minimum 44x44px
- Simplified navigation (header dropdown + swipe)
- Bottom-sheet modals for actions
- Disabled hover-only interactions
- Larger tap zones for task selection

**Desktop Optimizations:**

- Keyboard shortcuts as primary interaction
- Hover states for discoverability
- Multi-column layout with fixed widths
- Tooltips for explanatory text

**Progressive Enhancement:**

- Core functionality works without JavaScript (where possible)
- CSS-only states for hover, focus, active
- JavaScript enhances with keyboard shortcuts and optimistic updates

#### Accessibility

**Keyboard Navigation:**

- All interactive elements reachable via keyboard
- Clear focus indicators (ring-2 ring-offset-2)
- Logical tab order throughout application
- Skip links for main content navigation

**ARIA Attributes (via shadcn/ui):**

- Proper roles for custom components (dialog, menu, combobox)
- aria-label for icon-only buttons
- aria-describedby for error messages
- aria-expanded for expandable sections
- aria-current for active mode/list indicators

**Screen Reader Support:**

- Semantic HTML (nav, main, article, button)
- Live regions for dynamic updates (aria-live="polite" for task completion)
- Descriptive link text and button labels
- Form labels properly associated with inputs

**Visual Accessibility:**

- Color contrast ratios meeting WCAG AA (4.5:1 for text)
- Color not sole indicator (task origin uses both color and label)
- Focus indicators visible on all interactive elements
- Text resizable up to 200% without loss of functionality

**Help and Documentation:**

- Keyboard shortcuts help overlay (`?`)
- Tooltips explaining disabled controls
- Clear error messages with recovery instructions
- Command palette for discoverability

#### Security Considerations

**Authentication:**

- Google OAuth 2.0 for secure third-party authentication
- JWT stored in HttpOnly cookie (prevents XSS access)
- Secure, SameSite=Strict cookie attributes
- Automatic token refresh handled by backend

**Authorization:**

- All API requests require valid JWT
- Backend enforces user data isolation (userId scoping)
- Unauthenticated requests redirect to login
- Expired sessions clear state and redirect

**Data Validation:**

- Frontend validation with react-hook-form + zod
- Backend validation with class-validator (defense in depth)
- Sanitize user input before rendering (React does this automatically)
- Validate all API responses against expected types

**CORS and CSRF:**

- CORS configured to allow only frontend origin
- SameSite cookie attribute prevents CSRF
- Helmet middleware for security headers
- Rate limiting via @nestjs/throttler

**XSS Prevention:**

- React escapes all rendered content by default
- No dangerouslySetInnerHTML usage
- Sanitize any external data before rendering
- Content Security Policy headers (via Helmet)

**Network Security:**

- HTTPS only in production
- Secure WebSocket connections if added later
- API rate limiting to prevent abuse
- Sensitive data never logged client-side

---

</conversation_summary>

---

<unresolved_issues>

## Unresolved Issues

The following questions remain open and should be resolved during implementation:

### 1. Task Virtualization Strategy

**Question:** Do we need virtual scrolling for 100-task lists, or is DOM performance acceptable?
**Impact:** Performance at scale, bundle size
**Decision Point:** Test with 100 tasks rendered, monitor scroll performance on low-end devices
**Recommendation:** Start without virtualization, add react-window if scroll performance degrades

### 2. Keyboard Shortcut Conflicts

**Question:** How to handle browser shortcuts (e.g., `Cmd+W` closes window)?
**Impact:** User experience, shortcut discoverability
**Decision Point:** Document conflicts in help overlay, consider alternative shortcuts
**Recommendation:** Use `preventDefault()` cautiously, provide escape hatch via command palette

### 3. Animation Library Choice

**Question:** Do we need framer-motion or are CSS transitions sufficient?
**Impact:** Bundle size, animation complexity
**Decision Point:** Start with CSS transitions, evaluate need after initial implementation
**Recommendation:** CSS for simple transitions (fade, slide), framer-motion only if complex orchestration needed

### 4. Offline Handling

**Question:** Should we show offline indicator even though offline mode is out of scope?
**Impact:** User experience during network issues
**Decision Point:** Consider basic offline detection for better error UX
**Recommendation:** Add simple navigator.onLine detection with banner notification

### 5. Dark Mode Support

**Question:** Should we add dark mode toggle in MVP or defer to post-MVP?
**Impact:** User preference, implementation effort
**Decision Point:** Defer to post-MVP unless trivial with Tailwind
**Recommendation:** Implement class-based dark mode (Tailwind makes this easy), add toggle in settings

### 6. Order Indexing Strategy

**Question:** Fractional vs stepped integers for order_index; reindexing approach?
**Impact:** Reordering performance, database queries
**Decision Point:** Backend implementation decision
**Recommendation:** Stepped integers (1000, 2000, 3000) with reindexing when gaps exhausted

### 7. Final Keyboard Shortcut Map

**Question:** Complete list of all keyboard shortcuts for help overlay?
**Impact:** User documentation, shortcut conflicts
**Decision Point:** Document during implementation as shortcuts are added
**Recommendation:** Maintain living document of shortcuts, review for conflicts before finalizing

### 8. Active List Indicator (Backlogs Only)

**Question:** How to indicate active list clearly when only backlogs and Done exist (no intermediate lists)?
**Impact:** User orientation in Work Mode
**Decision Point:** UX design for visual indicator
**Recommendation:** Highlight rightmost backlog with distinct border/background, show "Active" badge

### 9. Mobile Long-Press Behaviors

**Question:** Should long-press on mobile open action menu or other gestures?
**Impact:** Mobile UX, touch interaction patterns
**Decision Point:** Test with users, evaluate discoverability
**Recommendation:** Long-press for context menu (Edit, Delete, Move), swipe for quick actions

### 10. Backlog Color Palette Specifics

**Question:** What are the exact 10 colors for backlog palette?
**Impact:** Visual design, brand consistency
**Decision Point:** Review backend implementation, ensure accessibility
**Recommendation:** Use Tailwind's color palette (e.g., blue-500, green-500, etc.) with WCAG AA contrast ratios

### 11. Error Retry Strategy

**Question:** Should failed mutations auto-retry or require manual retry?
**Impact:** User experience during network issues
**Decision Point:** Balance between automation and user control
**Recommendation:** Auto-retry once for network errors, manual retry button for persistent failures

### 12. Session Persistence

**Question:** Implement "remember last active mode" in MVP or defer?
**Impact:** User experience, development time
**Decision Point:** Marked as post-MVP in plan, confirm priority
**Recommendation:** Defer to post-MVP, always default to Plan Mode for MVP

</unresolved_issues>

---

## Implementation Phasing

Based on the architectural decisions, the implementation is organized into 7 phases:

**Phase 1: Foundation (Week 1)** - App shell, API client, state management setup
**Phase 2: Plan Mode Core (Week 2-3)** - Board layout, task/list CRUD, keyboard navigation
**Phase 3: Work Mode & Done (Week 4)** - Focused view, completion flow, archive
**Phase 4: Additional Features (Week 5)** - Dump mode, command palette, help overlay
**Phase 5: Mobile Responsive (Week 6)** - Mobile layouts, swipe navigation
**Phase 6: Polish & Testing (Week 7)** - Loading states, optimistic updates, testing
**Phase 7: Production Ready (Week 8)** - Performance optimization, accessibility audit, deployment

---

## Next Steps

1. **Review and Approval:** Share this summary with stakeholders for final sign-off
2. **Technical Setup:** Bootstrap frontend workspace with dependencies (Astro, React, TanStack Query, shadcn/ui)
3. **API Contract:** Confirm backend API is ready or document expected endpoints
4. **Begin Phase 1:** Start with authenticated shell and API client implementation
5. **Iterative Review:** Review after each phase completion, adjust as needed

---

**Document Status:** Complete and ready for implementation
**Prepared By:** Claude Code Assistant
**Date:** 2025-11-05
