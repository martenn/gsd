# Work Mode View Implementation Plan

## 1. Overview

Work Mode is a focused execution view that displays the top task from the active work list (rightmost non-Done list) with a short forecast of the next 2-3 upcoming tasks. This view minimizes distractions and provides a single action: marking the current task as complete. Upon completion, the task moves to the Done archive, and the next task automatically becomes the current focus.

**Key Characteristics:**
- Single-task focus with minimal UI
- Optimistic updates for immediate feedback
- Keyboard-first interaction (Space/Enter to complete)
- Automatic progression through task queue
- Empty state guidance when no tasks available

## 2. View Routing

**Path:** `/app/work`

**Route Type:** React SPA client-side route within authenticated app shell

**Access:** Requires authentication; accessible via:
- Direct URL navigation
- Global keyboard shortcut: `Cmd+W`
- Mode switcher in app header
- Command Palette action

## 3. Component Structure

```
WorkModePage (Route Component)
├── AppHeader (Shared across all authenticated views)
└── WorkModeLayout
    ├── ActiveListContext (displays "Working on: {List Name}")
    ├── CurrentTaskCard
    │   ├── TaskColorIndicator
    │   ├── TaskTitle
    │   ├── TaskDescription
    │   └── CompleteButton
    ├── ForecastSection
    │   ├── ForecastHeader ("Up Next")
    │   └── ForecastTaskCard (2-3 instances)
    │       ├── TaskColorIndicator
    │       └── TaskTitle
    └── EmptyWorkState (conditional)
        ├── EmptyMessage
        └── EmptyActions
```

**Component Hierarchy:**
- **WorkModePage** → Top-level route component
  - **AppHeader** → Global navigation (shared component)
  - **WorkModeLayout** → Layout wrapper with centered content
    - **ActiveListContext** → Displays current list name
    - **CurrentTaskCard** → Prominent display of current task (conditional: shown when task exists)
    - **ForecastSection** → Container for upcoming tasks (conditional: shown when forecast exists)
    - **EmptyWorkState** → Shown when no tasks available (conditional)

## 4. Component Details

### WorkModePage (Route Component)

- **Component description:** Top-level route component that orchestrates Work Mode view state and renders the layout.
- **Main elements:**
  - `<AppHeader>` shared component
  - `<WorkModeLayout>` containing main content
  - Loading spinner during initial data fetch
  - Error boundary for error handling
- **Handled events:**
  - Route mount: trigger data fetching
  - Keyboard shortcuts: Space/Enter (complete task), Cmd+P (switch to Plan), n (create task)
  - Window focus: refetch tasks if stale
- **Handled validation:**
  - Verify authentication status (redirect if unauthenticated)
  - Check if active list exists (show appropriate UI if not)
  - Validate task data completeness before rendering
- **Types:**
  - `ListDto` (from @gsd/types) - for lists data
  - `TaskDto` (from @gsd/types) - for task data
  - `WorkModeViewModel` (new) - aggregated view state
- **Props:**
  - None (route component, reads from URL and context)

---

### WorkModeLayout

- **Component description:** Layout container providing centered, focused layout for Work Mode content with proper spacing and max-width constraints.
- **Main elements:**
  - `<main>` semantic wrapper
  - `<div>` centered container (max-width: 800px)
  - Conditional rendering of content vs empty state
- **Handled interactions:**
  - None (pure layout component)
- **Handled validation:**
  - None
- **Types:**
  - `children: ReactNode` - content to render
- **Props:**
  - `children: ReactNode` - child components

---

### ActiveListContext

- **Component description:** Small contextual header showing the name of the active work list to provide user orientation.
- **Main elements:**
  - `<div>` or `<header>` with centered text
  - Text: "Working on: {activeListName}"
  - Subtle styling (muted color, smaller font)
- **Handled interactions:**
  - None (display only)
- **Handled validation:**
  - None
- **Types:**
  - `listName: string` - name of active list
- **Props:**
  - `listName: string` - active list name to display

---

### CurrentTaskCard

- **Component description:** Large, prominent card displaying the current task (top of active list) with all details and the complete action.
- **Main elements:**
  - `<article>` semantic wrapper
  - `<TaskColorIndicator>` - 4px left border or color badge showing origin backlog
  - `<h1>` or `<h2>` for task title (large, bold font)
  - `<p>` for task description (full text, readable size)
  - `<CompleteButton>` - Primary action button (bottom-right)
  - Optional: Keyboard shortcut hint (e.g., "Press Space to complete")
- **Handled interactions:**
  - Complete button click → trigger `onComplete` callback
  - Keyboard shortcut (Space/Enter) → trigger `onComplete` callback
- **Handled validation:**
  - Ensure task exists before rendering
  - Disable complete action if mutation in progress
- **Types:**
  - `task: TaskDto` - current task data
  - `isCompleting: boolean` - loading state for completion
  - `onComplete: () => void` - completion callback
- **Props:**
  - `task: TaskDto` - the current task to display
  - `isCompleting: boolean` - whether completion is in progress
  - `onComplete: () => void` - callback when complete action triggered

---

### TaskColorIndicator

- **Component description:** Visual indicator showing the origin backlog color of a task (4px left border or colored badge).
- **Main elements:**
  - `<div>` with colored left border (4px solid) OR
  - `<span>` badge with background color and backlog name
- **Handled interactions:**
  - None (visual only)
- **Handled validation:**
  - None
- **Types:**
  - `color: string` - hex color code
  - `backlogName?: string` - optional backlog name for badge variant
- **Props:**
  - `color: string` - hex color for indicator
  - `variant?: 'border' | 'badge'` - display style (default: 'border')
  - `backlogName?: string` - backlog name for badge variant

---

### TaskTitle

- **Component description:** Large, bold text displaying task title.
- **Main elements:**
  - `<h1>` or `<h2>` heading element
  - Large font size (text-2xl or text-3xl)
  - Bold font weight
- **Handled interactions:**
  - None (display only)
- **Handled validation:**
  - None
- **Types:**
  - `title: string` - task title text
- **Props:**
  - `title: string` - task title to display

---

### TaskDescription

- **Component description:** Full-text display of task description with readable typography.
- **Main elements:**
  - `<p>` or `<div>` element
  - Readable font size (text-base or text-lg)
  - Line height optimized for reading (leading-relaxed)
  - Conditional rendering (only shown if description exists)
- **Handled interactions:**
  - None (display only)
- **Handled validation:**
  - Check if description is non-null/non-empty before rendering
- **Types:**
  - `description: string | null` - task description
- **Props:**
  - `description: string | null` - description text (null if no description)

---

### CompleteButton

- **Component description:** Primary action button to mark the current task as complete.
- **Main elements:**
  - `<button>` element with primary styling (shadcn/ui Button component)
  - Text: "Complete" or "Mark Complete"
  - Icon: checkmark icon (lucide-react)
  - Loading spinner when `isLoading` is true
- **Handled interactions:**
  - Click → trigger `onClick` callback
  - Focus → auto-focus on view mount
  - Keyboard (Space/Enter) → trigger action
- **Handled validation:**
  - Disabled when `isLoading` is true
  - Disabled when no current task exists
- **Types:**
  - `onClick: () => void` - click handler
  - `isLoading: boolean` - loading state
  - `disabled: boolean` - disabled state
- **Props:**
  - `onClick: () => void` - callback when button clicked
  - `isLoading: boolean` - whether completion in progress
  - `disabled: boolean` - whether button should be disabled

---

### ForecastSection

- **Component description:** Container for upcoming task forecast, showing the next 2-3 tasks in the active list.
- **Main elements:**
  - `<section>` or `<aside>` semantic wrapper
  - `<h3>` heading: "Up Next" or "Coming Up"
  - List of `<ForecastTaskCard>` components (2-3 tasks)
  - Conditional rendering (only shown if forecast tasks exist)
- **Handled interactions:**
  - None (display only, cards are non-interactive)
- **Handled validation:**
  - Check if forecast array is non-empty before rendering
  - Limit to maximum 3 tasks in forecast
- **Types:**
  - `forecastTasks: TaskDto[]` - array of upcoming tasks
- **Props:**
  - `forecastTasks: TaskDto[]` - array of 2-3 upcoming tasks

---

### ForecastTaskCard

- **Component description:** Compact, read-only task preview card for forecast display.
- **Main elements:**
  - `<div>` wrapper with compact styling
  - `<TaskColorIndicator>` - smaller version showing origin color
  - Task title (truncated if too long, or full text)
  - Optional: truncated description (first line)
  - Non-interactive (no hover state, no actions)
- **Handled interactions:**
  - None (read-only display)
- **Handled validation:**
  - None
- **Types:**
  - `task: TaskDto` - task data
- **Props:**
  - `task: TaskDto` - task to display in forecast

---

### EmptyWorkState

- **Component description:** Empty state UI shown when the active list has no tasks.
- **Main elements:**
  - `<div>` centered container
  - Heading: "No tasks in {activeListName}"
  - Subtext: Encouragement or guidance
  - Action buttons:
    - "Add Task" (keyboard hint: n) → opens Dump Mode or inline creation
    - "Switch to Plan Mode" (keyboard hint: Cmd+P) → navigate to Plan
- **Handled interactions:**
  - "Add Task" button click → open Dump Mode modal or create task inline
  - "Switch to Plan Mode" button click → navigate to `/app/plan`
- **Handled validation:**
  - None
- **Types:**
  - `activeListName: string` - name of empty list
  - `onAddTask: () => void` - callback for add task action
  - `onSwitchToPlan: () => void` - callback for navigation
- **Props:**
  - `activeListName: string` - name of the active list
  - `onAddTask: () => void` - callback when "Add Task" clicked
  - `onSwitchToPlan: () => void` - callback when "Switch to Plan Mode" clicked

---

## 5. Types

### Existing Types (from @gsd/types)

**TaskDto:**
```typescript
interface TaskDto {
  id: string;
  userId: string;
  listId: string;
  originBacklogId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  color: string; // Origin backlog color
  isCompleted: boolean;
  createdAt: Date;
  completedAt: Date | null;
}
```

**ListDto:**
```typescript
interface ListDto {
  id: string;
  name: string;
  orderIndex: number;
  isBacklog: boolean;
  isDone: boolean;
  color: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**GetTasksResponseDto:**
```typescript
interface GetTasksResponseDto {
  tasks: TaskDto[];
  total: number;
  limit: number;
  offset: number;
}
```

**CompleteTaskResponseDto:**
```typescript
interface CompleteTaskResponseDto {
  task: TaskDto;
}
```

**GetListsResponseDto:**
```typescript
interface GetListsResponseDto {
  lists: ListDto[];
}
```

---

### New ViewModel Types (View-Specific)

**WorkModeViewModel:**
Aggregated state for the entire Work Mode view.

```typescript
interface WorkModeViewModel {
  activeList: {
    id: string;
    name: string;
    isBacklog: boolean;
  } | null;
  currentTask: TaskDto | null;
  forecastTasks: TaskDto[];
  isEmpty: boolean; // true if no tasks in active list
  isLoading: boolean;
  error: string | null;
}
```

**Fields:**
- `activeList` - Information about the active work list (rightmost non-Done list)
  - `id: string` - List ID
  - `name: string` - List name for display
  - `isBacklog: boolean` - Whether the active list is a backlog
- `currentTask` - The top task in the active list (null if no tasks)
- `forecastTasks` - Array of next 2-3 tasks in the active list (empty array if fewer than 2 tasks)
- `isEmpty` - Boolean flag indicating if active list has no tasks
- `isLoading` - Loading state for initial data fetch
- `error` - Error message if data fetch failed

---

**WorkModeState:**
Internal state type for `useWorkMode` hook.

```typescript
interface WorkModeState {
  lists: ListDto[];
  tasks: TaskDto[];
  activeListId: string | null;
  isLoadingLists: boolean;
  isLoadingTasks: boolean;
  isCompleting: boolean;
  error: string | null;
}
```

**Fields:**
- `lists` - All non-Done lists fetched from API
- `tasks` - All tasks in the active list
- `activeListId` - ID of the determined active list
- `isLoadingLists` - Loading state for lists query
- `isLoadingTasks` - Loading state for tasks query
- `isCompleting` - Loading state for complete mutation
- `error` - Error message from any operation

---

## 6. State Management

Work Mode state is managed using **TanStack Query** for server state and **local React state** for UI state. A custom hook `useWorkMode` orchestrates all state logic.

### Custom Hook: `useWorkMode`

**Purpose:** Centralize all Work Mode logic including:
- Determining the active work list
- Fetching tasks from active list
- Completing the current task with optimistic updates
- Deriving the WorkModeViewModel for rendering

**Implementation:**

```typescript
function useWorkMode(): WorkModeViewModel & {
  completeCurrentTask: () => void;
}
```

**Internal Logic:**

1. **Fetch Lists:**
   - Use TanStack Query: `useQuery(['lists'], fetchLists)`
   - Filter to non-Done lists only
   - Determine active list: rightmost list by `orderIndex`
   - If only backlogs exist, use rightmost backlog
   - Cache lists data for quick access

2. **Fetch Tasks from Active List:**
   - Use TanStack Query: `useQuery(['tasks', activeListId], () => fetchTasks(activeListId))`
   - Dependent query: only runs if `activeListId` is determined
   - Sort tasks by `orderIndex` ascending
   - Cache tasks data

3. **Derive ViewModel:**
   - `activeList`: Extract active list info (id, name, isBacklog)
   - `currentTask`: First task in sorted tasks array (tasks[0])
   - `forecastTasks`: Next 2-3 tasks (tasks.slice(1, 4))
   - `isEmpty`: Boolean check (tasks.length === 0)
   - `isLoading`: Combine `isLoadingLists || isLoadingTasks`
   - `error`: Aggregate errors from queries

4. **Complete Task Mutation:**
   - Use TanStack Query: `useMutation(completeTask, { onMutate, onSuccess, onError })`
   - **Optimistic Update (onMutate):**
     - Snapshot current tasks cache
     - Update cache: remove current task from tasks array
     - Return snapshot for rollback
   - **On Success:**
     - Invalidate tasks query to refetch
     - Show success feedback (optional toast)
     - Auto-focus next task (new current task)
   - **On Error:**
     - Rollback to snapshot
     - Display inline error message
     - Provide retry action

**Return Value:**
```typescript
{
  activeList: { id, name, isBacklog } | null,
  currentTask: TaskDto | null,
  forecastTasks: TaskDto[],
  isEmpty: boolean,
  isLoading: boolean,
  error: string | null,
  completeCurrentTask: () => void
}
```

---

### TanStack Query Configuration

**Queries:**
- `['lists']` - Fetch all lists
  - Stale time: 5 minutes
  - Refetch on window focus: true
- `['tasks', activeListId]` - Fetch tasks from active list
  - Stale time: 1 minute
  - Refetch on window focus: true
  - Enabled: only if `activeListId` is not null

**Mutations:**
- `completeTask` - Complete a task
  - Optimistic update enabled
  - Retry: 1 time on failure
  - Invalidate queries on success: `['tasks', activeListId]`, `['done']`

---

## 7. API Integration

### Required API Calls

**1. Fetch All Lists**
- **Endpoint:** `GET /v1/lists`
- **Request Type:** None (no params)
- **Response Type:** `GetListsResponseDto`
- **Usage:** Determine active work list (rightmost non-Done list)
- **Error Handling:** Display error message if fetch fails; retry button

**2. Fetch Tasks from Active List**
- **Endpoint:** `GET /v1/tasks?listId={activeListId}`
- **Request Type:** Query params: `{ listId: string }`
- **Response Type:** `GetTasksResponseDto`
- **Usage:** Retrieve current task and forecast tasks
- **Error Handling:** Display error message; retry button

**3. Complete Current Task**
- **Endpoint:** `POST /v1/tasks/{taskId}/complete`
- **Request Type:** Path param: `taskId`
- **Response Type:** `CompleteTaskResponseDto`
- **Usage:** Mark current task as complete and move to Done
- **Error Handling:** Rollback optimistic update; show inline error; retry button

---

### API Client Implementation

**Fetch Lists:**
```typescript
async function fetchLists(): Promise<GetListsResponseDto> {
  const response = await fetch('/v1/lists', {
    credentials: 'include', // Include JWT cookie
  });
  if (!response.ok) throw new Error('Failed to fetch lists');
  return response.json();
}
```

**Fetch Tasks:**
```typescript
async function fetchTasks(listId: string): Promise<GetTasksResponseDto> {
  const response = await fetch(`/v1/tasks?listId=${listId}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}
```

**Complete Task:**
```typescript
async function completeTask(taskId: string): Promise<CompleteTaskResponseDto> {
  const response = await fetch(`/v1/tasks/${taskId}/complete`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to complete task');
  return response.json();
}
```

---

## 8. User Interactions

### Primary Interaction: Complete Current Task

**Trigger:**
- Click "Complete" button
- Press Space key
- Press Enter key

**Flow:**
1. User triggers complete action
2. **Optimistic Update:**
   - Current task fades out (CSS transition)
   - Next task in forecast smoothly animates into current position
   - Forecast updates to show next 2-3 tasks
3. **API Call:**
   - POST request to `/v1/tasks/{taskId}/complete`
   - Loading state shown (button disabled, optional spinner)
4. **On Success:**
   - Cache updated with new task list
   - Success feedback (optional subtle animation)
   - Focus automatically moves to new current task's complete button
5. **On Failure:**
   - Optimistic update reverted (previous task returns)
   - Inline error message displayed
   - "Retry" button appears next to error

---

### Secondary Interaction: Navigate to Plan Mode

**Trigger:**
- Press `Cmd+P` keyboard shortcut
- Click "Switch to Plan Mode" link/button in empty state
- Click "Plan" tab in mode switcher (AppHeader)

**Flow:**
1. User triggers navigation
2. React Router navigates to `/app/plan`
3. Work Mode unmounts, Plan Mode mounts

---

### Tertiary Interaction: Add Task (from Empty State)

**Trigger:**
- Press `n` keyboard shortcut
- Click "Add Task" button in empty state

**Flow:**
1. User triggers add task action
2. Open Dump Mode modal (overlay) OR open inline task creation form
3. User creates task(s)
4. Tasks added to active list
5. Work Mode refreshes to show new current task

---

## 9. Conditions and Validation

### Active List Determination

**Condition:** Active list is the rightmost non-Done list (highest `orderIndex`)

**Validation Steps:**
1. Fetch all lists via `GET /v1/lists`
2. Filter lists: exclude lists where `isDone === true`
3. If filtered list is empty → Show error state ("No active lists found")
4. Sort filtered lists by `orderIndex` descending
5. Select first list (highest `orderIndex`) as active list
6. **Edge Case:** If only backlogs exist (no intermediate lists), the rightmost backlog becomes the active list

**UI Impact:**
- Active list name displayed in `ActiveListContext`
- Tasks fetched from this list ID
- Empty state message references this list name

---

### Current Task Determination

**Condition:** Current task is the first task in the active list (lowest `orderIndex`)

**Validation Steps:**
1. Fetch tasks from active list via `GET /v1/tasks?listId={activeListId}`
2. Sort tasks by `orderIndex` ascending
3. Select first task as current task
4. If tasks array is empty → Show `EmptyWorkState`

**UI Impact:**
- Current task displayed in `CurrentTaskCard`
- Complete button enabled only if current task exists

---

### Forecast Tasks Determination

**Condition:** Forecast consists of tasks at positions 2-4 in the active list (next 2-3 tasks)

**Validation Steps:**
1. After determining current task, slice tasks array: `tasks.slice(1, 4)`
2. If slice length < 2 → Show shorter forecast or hide forecast section
3. Maximum 3 tasks in forecast

**UI Impact:**
- Forecast section shown only if forecast array is non-empty
- Forecast cards rendered for each task in forecast array

---

### Complete Action Validation

**Conditions for Enabling Complete Button:**
- Current task exists (`currentTask !== null`)
- No completion mutation in progress (`!isCompleting`)
- User is authenticated (checked at route level)

**Validation Steps:**
1. Check `currentTask` is not null
2. Check `isCompleting` is false
3. Enable button and allow action

**API Validation:**
- Backend validates task exists and belongs to user
- Backend validates task is not already completed
- Returns 404 if task not found, 400 if already completed

**UI Impact:**
- Complete button disabled state
- Error handling for failed completion

---

## 10. Error Handling

### Error Scenarios and Handling

**1. Failed to Fetch Lists**
- **Scenario:** API call to `GET /v1/lists` fails (network error, 500 error)
- **Handling:**
  - Display inline error message: "Failed to load lists. Check your connection and try again."
  - Show "Retry" button
  - Keep Work Mode layout visible with error state
  - Log error to console for debugging

**2. Failed to Fetch Tasks**
- **Scenario:** API call to `GET /v1/tasks` fails
- **Handling:**
  - Display inline error message: "Failed to load tasks. Check your connection and try again."
  - Show "Retry" button
  - Keep active list context visible
  - Log error to console

**3. No Active List Found**
- **Scenario:** All lists are marked as `isDone` or no lists exist
- **Handling:**
  - Display error state: "No active lists found. Please create a list in Plan Mode."
  - Provide "Go to Plan Mode" button
  - Log issue to console

**4. Failed to Complete Task**
- **Scenario:** API call to `POST /v1/tasks/{id}/complete` fails (network error, 404, 500)
- **Handling:**
  - Rollback optimistic update (restore previous current task)
  - Display inline error message: "Failed to complete task. Please try again."
  - Show "Retry" button next to error
  - Keep complete button enabled for retry
  - Log error to console

**5. Task Already Completed (Race Condition)**
- **Scenario:** Task was completed elsewhere (another device/tab)
- **Handling:**
  - Refetch tasks to get updated state
  - Move to next task automatically if available
  - Display brief message: "Task was already completed."

**6. Active List Deleted During Session**
- **Scenario:** User or another session deletes the active list
- **Handling:**
  - Detect on next API call (404 or list not found in query)
  - Refetch lists to determine new active list
  - If new active list found, switch to it
  - If no active list, show error state with "Go to Plan Mode" action

**7. Network Offline**
- **Scenario:** User loses internet connection
- **Handling:**
  - Detect network error in API calls
  - Display persistent error banner: "You're offline. Reconnect to continue."
  - Disable all actions that require API calls
  - Automatically retry when connection restored (TanStack Query retry logic)

---

### Error Message Patterns

**Inline Errors:** Display near the action that failed (e.g., below complete button)

**Error Components:**
- Error text with clear explanation
- Retry button (primary action)
- Dismiss button (optional, for non-critical errors)

**Error State Styling:**
- Use red/destructive color scheme (Tailwind `text-red-600`)
- Icon: warning or error icon (lucide-react)
- Accessible: `role="alert"` for screen readers

---

## 11. Implementation Steps

### Phase 1: Setup and Data Layer (Steps 1-3)

**Step 1: Create Route Structure**
- Create `apps/frontend/src/pages/app/work.astro` or React Router route
- Mount `WorkModePage` component at `/app/work`
- Ensure authentication middleware protects route
- Test route navigation from landing/other views

**Step 2: Implement API Client Functions**
- Create `apps/frontend/src/api/lists.ts` with `fetchLists` function
- Create `apps/frontend/src/api/tasks.ts` with `fetchTasks` and `completeTask` functions
- Use existing types from `@gsd/types`
- Add error handling and response validation
- Test API functions in isolation

**Step 3: Create `useWorkMode` Custom Hook**
- Create `apps/frontend/src/hooks/useWorkMode.ts`
- Implement lists query using TanStack Query
- Implement active list determination logic
- Implement tasks query (dependent on active list)
- Derive `WorkModeViewModel` from queries
- Export hook with `completeCurrentTask` function
- Write unit tests for hook logic

---

### Phase 2: Core Components (Steps 4-6)

**Step 4: Build `WorkModePage` Container**
- Create `apps/frontend/src/components/WorkModePage.tsx`
- Use `useWorkMode` hook to get view state
- Handle loading state (show spinner)
- Handle error state (show error message with retry)
- Render `WorkModeLayout` with content or empty state
- Test component with mock data

**Step 5: Build `CurrentTaskCard` Component**
- Create `apps/frontend/src/components/work/CurrentTaskCard.tsx`
- Accept `task`, `isCompleting`, `onComplete` props
- Render task title, description, color indicator
- Render `CompleteButton` component
- Add focus management (auto-focus complete button)
- Test component rendering and interactions

**Step 6: Build `CompleteButton` Component**
- Create `apps/frontend/src/components/work/CompleteButton.tsx`
- Use shadcn/ui Button component with primary variant
- Add checkmark icon from lucide-react
- Handle loading state (show spinner, disable button)
- Handle disabled state
- Test button states and click handler

---

### Phase 3: Forecast and Empty State (Steps 7-8)

**Step 7: Build Forecast Components**
- Create `apps/frontend/src/components/work/ForecastSection.tsx`
- Create `apps/frontend/src/components/work/ForecastTaskCard.tsx`
- Render "Up Next" heading
- Map forecast tasks to `ForecastTaskCard` components
- Style cards as compact, read-only previews
- Test conditional rendering (no forecast if < 2 tasks)

**Step 8: Build `EmptyWorkState` Component**
- Create `apps/frontend/src/components/work/EmptyWorkState.tsx`
- Display empty message with active list name
- Render "Add Task" and "Switch to Plan Mode" action buttons
- Wire up button callbacks
- Test empty state rendering and actions

---

### Phase 4: Interactions and Optimistic Updates (Steps 9-10)

**Step 9: Implement Complete Task Action**
- In `useWorkMode` hook, implement `completeCurrentTask` function
- Use TanStack Query `useMutation` with optimistic update
- **Optimistic Update Logic:**
  - Snapshot current tasks cache
  - Update cache: remove current task from array
  - Return snapshot for rollback
- **On Success:**
  - Invalidate `['tasks', activeListId]` query
  - Auto-focus new current task's complete button
- **On Error:**
  - Rollback cache to snapshot
  - Set error state for UI display
- Test mutation with success and failure scenarios

**Step 10: Add Keyboard Shortcuts**
- Create `apps/frontend/src/hooks/useKeyboardShortcuts.ts` (if not already exists)
- Register global shortcut: `Cmd+W` → navigate to Work Mode
- Register view-specific shortcuts:
  - `Space` or `Enter` → complete current task
  - `Cmd+P` → navigate to Plan Mode
  - `n` → open Dump Mode or create task
- Handle shortcut conflicts (e.g., prevent Space from scrolling page)
- Test shortcuts in different contexts

---

### Phase 5: Polish and Edge Cases (Steps 11-12)

**Step 11: Add Loading and Error States**
- Create loading skeleton for initial page load
- Add loading spinner for complete button during mutation
- Implement error message display with retry action
- Test loading states and error recovery flows
- Ensure accessible ARIA attributes for loading states

**Step 12: Responsive and Mobile Styling**
- Apply Tailwind responsive classes
- Test on mobile viewport (single-column, full-width)
- Enlarge complete button for touch targets (min 44x44px)
- Ensure forecast cards stack vertically on mobile
- Test swipe gestures (if applicable)
- Verify text sizing and readability on small screens

---

### Phase 6: Testing and Integration (Steps 13-14)

**Step 13: Integration Testing**
- Test full user flow: navigate to Work Mode → complete task → task moves to Done
- Test empty state flow: no tasks → add task → task appears
- Test error recovery: network failure → retry → success
- Test keyboard navigation and shortcuts
- Test optimistic updates and rollback on failure
- Test edge cases: last task completion, list deleted, etc.

**Step 14: Cross-Browser and Accessibility Testing**
- Test in Chrome, Firefox, Safari
- Test with keyboard-only navigation (no mouse)
- Test with screen reader (VoiceOver, NVDA)
- Verify ARIA attributes and semantic HTML
- Check color contrast (WCAG AA compliance)
- Fix any accessibility issues found

---

### Phase 7: Documentation and Handoff (Step 15)

**Step 15: Document Component API and Usage**
- Add JSDoc comments to all components
- Document prop types and descriptions
- Add usage examples in component files
- Update project README if needed
- Create Storybook stories (optional, if using Storybook)

---

## Summary

This implementation plan provides a comprehensive roadmap for building the Work Mode view in the GSD application. The view focuses on execution with a single-task display, minimal distractions, and optimistic updates for immediate feedback. Key challenges include determining the active work list, handling optimistic updates and rollbacks, managing focus after task completion, and gracefully handling edge cases like empty lists or network failures.

By following the phased implementation approach, the development team can build the view incrementally, testing each component and interaction in isolation before integrating into the full view. The use of TanStack Query for server state management and a custom `useWorkMode` hook for orchestration keeps the code organized and testable.

The Work Mode view will provide users with a distraction-free environment to complete their tasks efficiently, with clear feedback and easy navigation back to Plan Mode when reordering is needed.
