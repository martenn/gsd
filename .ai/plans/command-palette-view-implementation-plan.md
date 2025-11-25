# View Implementation Plan: Command Palette Modal

## 1. Overview

The Command Palette Modal is a keyboard-driven action search interface accessible via `Cmd+K` from any view in the GSD application. It provides users with quick access to common actions through a searchable, filterable list. The component uses shadcn/ui's Command component (based on cmdk) to deliver a VS Code-like command palette experience with fuzzy search, grouped actions, keyboard navigation, and full accessibility support.

## 2. View Routing

**Path:** N/A (Modal overlay)
**Trigger:** Global keyboard shortcut `Cmd+K` (or `Ctrl+K` on Windows/Linux)
**Accessible From:** Any authenticated view (Plan Mode, Work Mode, Done Archive)

## 3. Component Structure

```
<CommandPaletteModal>                    # Root modal container with overlay
  <Command>                              # shadcn/ui Command component
    <CommandInput />                     # Search input (autofocused)
    <CommandList>                        # Scrollable results container
      <CommandEmpty />                   # Empty state for no results

      <CommandGroup heading="Navigation">
        <CommandItem />                  # Go to Plan Mode
        <CommandItem />                  # Go to Work Mode
        <CommandItem />                  # Go to Done Archive
      </CommandGroup>

      <CommandGroup heading="Tasks">
        <CommandItem />                  # Create Task
        <CommandItem />                  # Complete Current Task
      </CommandGroup>

      <CommandGroup heading="Lists">
        <CommandItem />                  # Create List
        <CommandItem />                  # Toggle Backlog Status
      </CommandGroup>

      <CommandGroup heading="Other">
        <CommandItem />                  # Show Keyboard Shortcuts
        <CommandItem />                  # Open Dump Mode
      </CommandGroup>
    </CommandList>
  </Command>
</CommandPaletteModal>
```

**Component Hierarchy:**
- CommandPaletteModal (root container)
  - Command (cmdk wrapper)
    - CommandInput (search)
    - CommandList (results container)
      - CommandEmpty (no results state)
      - CommandGroup (category wrapper) × 4
        - CommandItem (individual action) × N per group

## 4. Component Details

### CommandPaletteModal

**Component Description:**
Root modal container that provides the overlay backdrop and modal dialog. Handles global keyboard listener for `Cmd+K`, focus trapping, and dismissal via Esc or outside click.

**Main HTML Elements:**
- Dialog overlay (`<div role="dialog" aria-modal="true">`)
- Backdrop with semi-transparent background
- Centered modal content container

**Child Components:**
- `<Command>` from shadcn/ui

**Handled Events:**
- Global `keydown` event (listen for `Cmd+K` to open)
- `Esc` key to close modal
- Click on backdrop to close modal
- Focus trap preventing Tab from escaping modal

**Validation Conditions:**
- None (presentation only)

**Types:**
- `CommandPaletteModalProps` (isOpen, onClose)

**Props:**
```typescript
interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

---

### CommandPaletteContent

**Component Description:**
Inner content wrapper that manages the command palette's actions, context, and execution logic. Filters actions based on current mode and user permissions.

**Main HTML Elements:**
- None (just logic wrapper)

**Child Components:**
- `<Command>` with all nested command components

**Handled Events:**
- Action selection (executes action callback)
- Search query changes (filters actions)

**Validation Conditions:**
- Actions filtered by `enabled()` function
- Context-dependent action availability (e.g., "Complete Task" only in Work Mode)

**Types:**
- `CommandPaletteContentProps` (actions, context, onActionSelect)
- `CommandPaletteContext` (current mode, navigation, action handlers)

**Props:**
```typescript
interface CommandPaletteContentProps {
  actions: Action[];
  context: CommandPaletteContext;
  onActionSelect: (action: Action) => void;
}
```

---

### CommandInput

**Component Description:**
Search input field from shadcn/ui Command. Autofocused when modal opens. Accepts free-form text for fuzzy matching against action labels and keywords.

**Main HTML Elements:**
- `<input type="text">` with combobox ARIA attributes
- Search icon (lucide-react `Search`)

**Child Components:**
- None (primitive component from shadcn/ui)

**Handled Events:**
- `onChange` - Updates search query, triggers filtering
- Keyboard navigation handled by cmdk (↑↓ to navigate results)

**Validation Conditions:**
- None (free text input, no restrictions)

**Types:**
- shadcn/ui Command component props

**Props:**
```typescript
// Uses shadcn/ui CommandInput props
{
  placeholder: string;
  value?: string;
  onValueChange?: (value: string) => void;
}
```

---

### CommandList

**Component Description:**
Scrollable container for filtered command results. Displays grouped actions or empty state when no matches found.

**Main HTML Elements:**
- Scrollable `<div>` with ARIA listbox attributes
- Max height with overflow-y scroll

**Child Components:**
- `<CommandEmpty>` (conditional)
- `<CommandGroup>` × N (one per category)

**Handled Events:**
- None (container only)

**Validation Conditions:**
- None

**Types:**
- shadcn/ui CommandList props

**Props:**
```typescript
// Uses shadcn/ui CommandList props
{
  children: ReactNode;
}
```

---

### CommandEmpty

**Component Description:**
Empty state displayed when search query yields no matching actions.

**Main HTML Elements:**
- `<div>` with centered text: "No results found."

**Child Components:**
- None

**Handled Events:**
- None

**Validation Conditions:**
- Shown when filtered actions array is empty

**Types:**
- shadcn/ui CommandEmpty props

**Props:**
```typescript
// Uses shadcn/ui CommandEmpty props
{
  children?: ReactNode;
}
```

---

### CommandGroup

**Component Description:**
Groups related actions by category (Navigation, Tasks, Lists, Other). Displays category heading above grouped items.

**Main HTML Elements:**
- `<div role="group">` with ARIA label
- Category heading (`<div>` with muted text style)
- Action items container

**Child Components:**
- `<CommandItem>` × N (multiple action items)

**Handled Events:**
- None

**Validation Conditions:**
- Only rendered if group contains at least one enabled action

**Types:**
- shadcn/ui CommandGroup props

**Props:**
```typescript
// Uses shadcn/ui CommandGroup props
{
  heading?: string;
  children: ReactNode;
}
```

---

### CommandItem

**Component Description:**
Individual action item displaying action label, optional icon, and keyboard shortcut hint. Executes action on selection (click or Enter).

**Main HTML Elements:**
- `<div role="option">` with hover/selected states
- Icon (left, from lucide-react)
- Label (center, bold)
- Keyboard shortcut badge (right, muted)

**Child Components:**
- Icon component (from lucide-react)
- Keyboard shortcut badge

**Handled Events:**
- `onClick` - Executes action
- `onSelect` - Triggered by Enter key or click

**Validation Conditions:**
- Only rendered if `action.enabled(context)` returns true
- Disabled state shown if action temporarily unavailable

**Types:**
- `CommandItemProps` (action, onSelect)
- `Action` interface

**Props:**
```typescript
interface CommandItemProps {
  action: Action;
  onSelect: () => void;
}
```

## 5. Types

### Action Interface

Defines the structure of each command palette action.

```typescript
interface Action {
  /** Unique identifier for the action */
  id: string;

  /** Display label shown in command palette */
  label: string;

  /** Optional description for additional context */
  description?: string;

  /** Category for grouping (Navigation, Tasks, Lists, Other) */
  category: 'navigation' | 'tasks' | 'lists' | 'other';

  /** Optional lucide-react icon name (e.g., 'Home', 'Plus') */
  icon?: string;

  /** Optional keyboard shortcut hint (e.g., 'Cmd+P') */
  shortcut?: string;

  /** Keywords for fuzzy search matching */
  keywords?: string[];

  /** Function to determine if action is available in current context */
  enabled: (context: CommandPaletteContext) => boolean;

  /** Function to execute when action is selected */
  execute: (context: CommandPaletteContext) => void | Promise<void>;
}
```

**Example Actions:**
```typescript
const goToPlanMode: Action = {
  id: 'go-to-plan',
  label: 'Go to Plan Mode',
  category: 'navigation',
  icon: 'LayoutGrid',
  shortcut: 'Cmd+P',
  keywords: ['plan', 'board', 'lists'],
  enabled: () => true,
  execute: (ctx) => ctx.navigate('/app/plan'),
};

const createTask: Action = {
  id: 'create-task',
  label: 'Create Task',
  description: 'Add a new task to selected list',
  category: 'tasks',
  icon: 'Plus',
  shortcut: 'n',
  keywords: ['new', 'add', 'task', 'create'],
  enabled: (ctx) => ctx.listCount < 10, // Check list limit
  execute: (ctx) => ctx.openTaskCreationForm(),
};
```

### CommandPaletteContext Interface

Provides context and action handlers to command palette actions.

```typescript
interface CommandPaletteContext {
  /** Current mode the user is in */
  currentMode: 'plan' | 'work' | 'done';

  /** Currently selected list ID (Plan Mode) */
  selectedListId?: string | null;

  /** Currently selected task ID (Plan/Work Mode) */
  selectedTaskId?: string | null;

  /** Total number of non-Done lists */
  listCount: number;

  /** Total number of backlogs */
  backlogCount: number;

  /** Navigation function (React Router navigate) */
  navigate: (path: string) => void;

  /** Open modal function (Dump Mode, Keyboard Help) */
  openModal: (modal: 'dump' | 'help') => void;

  /** Open task creation form/dialog */
  openTaskCreationForm: () => void;

  /** Complete the current task (Work Mode) */
  completeCurrentTask: () => Promise<void>;

  /** Open list creation form/dialog */
  openListCreationForm: () => void;

  /** Toggle backlog status of selected list */
  toggleBacklogStatus: () => Promise<void>;
}
```

### Component Props Interfaces

```typescript
interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandPaletteContentProps {
  actions: Action[];
  context: CommandPaletteContext;
  onActionSelect: (action: Action) => void;
}

interface CommandItemProps {
  action: Action;
  onSelect: () => void;
}
```

## 6. State Management

### Global State

**Managed in:** App-level context or AppShell component

**State Variables:**
- `commandPaletteOpen: boolean` - Whether modal is currently open

**Update Methods:**
- `openCommandPalette()` - Set to true
- `closeCommandPalette()` - Set to false

### Local State (within CommandPalette components)

**State Variables:**
- `searchQuery: string` - Current search input value (managed by cmdk)
- `selectedIndex: number` - Currently highlighted action (managed by cmdk)
- `filteredActions: Action[]` - Actions after filtering (computed from search)

### Custom Hook: useCommandPalette

**Purpose:** Centralize command palette logic, actions definition, and keyboard listener.

**Location:** `hooks/useCommandPalette.ts`

**Implementation:**
```typescript
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const currentMode = useCurrentMode(); // from router context
  const navigate = useNavigate();
  const { openModal } = useModalContext();
  const { data: lists } = useListsQuery();
  const { selectedListId, selectedTaskId } = useKeyboardNavigationContext();

  // Build context object
  const context: CommandPaletteContext = useMemo(() => ({
    currentMode,
    selectedListId,
    selectedTaskId,
    listCount: lists?.lists.length ?? 0,
    backlogCount: lists?.lists.filter(l => l.isBacklog).length ?? 0,
    navigate,
    openModal,
    openTaskCreationForm: () => {
      // Implementation to open task form
    },
    completeCurrentTask: async () => {
      // Implementation to complete task
    },
    openListCreationForm: () => {
      // Implementation to open list form
    },
    toggleBacklogStatus: async () => {
      // Implementation to toggle backlog
    },
  }), [currentMode, selectedListId, selectedTaskId, lists, navigate, openModal]);

  // Define all actions
  const actions: Action[] = useMemo(() => [
    // Navigation actions
    {
      id: 'go-to-plan',
      label: 'Go to Plan Mode',
      category: 'navigation',
      icon: 'LayoutGrid',
      shortcut: 'Cmd+P',
      keywords: ['plan', 'board', 'lists'],
      enabled: () => true,
      execute: (ctx) => ctx.navigate('/app/plan'),
    },
    {
      id: 'go-to-work',
      label: 'Go to Work Mode',
      category: 'navigation',
      icon: 'Play',
      shortcut: 'Cmd+W',
      keywords: ['work', 'focus', 'execute'],
      enabled: () => true,
      execute: (ctx) => ctx.navigate('/app/work'),
    },
    {
      id: 'go-to-done',
      label: 'Go to Done Archive',
      category: 'navigation',
      icon: 'Archive',
      shortcut: 'Cmd+Shift+A',
      keywords: ['done', 'archive', 'completed'],
      enabled: () => true,
      execute: (ctx) => ctx.navigate('/app/done'),
    },

    // Task actions
    {
      id: 'create-task',
      label: 'Create Task',
      category: 'tasks',
      icon: 'Plus',
      shortcut: 'n',
      keywords: ['new', 'add', 'task', 'create'],
      enabled: () => true,
      execute: (ctx) => ctx.openTaskCreationForm(),
    },
    {
      id: 'complete-task',
      label: 'Complete Current Task',
      category: 'tasks',
      icon: 'Check',
      shortcut: 'Space',
      keywords: ['complete', 'done', 'finish'],
      enabled: (ctx) => ctx.currentMode === 'work' && ctx.selectedTaskId != null,
      execute: (ctx) => ctx.completeCurrentTask(),
    },

    // List actions
    {
      id: 'create-list',
      label: 'Create List',
      category: 'lists',
      icon: 'PlusCircle',
      shortcut: 'l',
      keywords: ['new', 'add', 'list', 'create'],
      enabled: (ctx) => ctx.listCount < 10,
      execute: (ctx) => ctx.openListCreationForm(),
    },
    {
      id: 'toggle-backlog',
      label: 'Toggle Backlog Status',
      category: 'lists',
      icon: 'Star',
      keywords: ['backlog', 'toggle', 'mark'],
      enabled: (ctx) =>
        ctx.currentMode === 'plan' &&
        ctx.selectedListId != null &&
        ctx.backlogCount > 1, // Prevent unmarking last backlog
      execute: (ctx) => ctx.toggleBacklogStatus(),
    },

    // Other actions
    {
      id: 'show-shortcuts',
      label: 'Show Keyboard Shortcuts',
      category: 'other',
      icon: 'Keyboard',
      shortcut: '?',
      keywords: ['help', 'shortcuts', 'keyboard', 'keys'],
      enabled: () => true,
      execute: (ctx) => ctx.openModal('help'),
    },
    {
      id: 'open-dump-mode',
      label: 'Open Dump Mode',
      category: 'other',
      icon: 'FileText',
      shortcut: 'Cmd+Shift+D',
      keywords: ['dump', 'bulk', 'add', 'quick'],
      enabled: () => true,
      execute: (ctx) => ctx.openModal('dump'),
    },
  ], []);

  // Open/close handlers
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global keyboard listener for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return {
    isOpen,
    open,
    close,
    actions,
    context,
  };
}
```

**Usage in AppShell:**
```typescript
function AppShell() {
  const { isOpen, close, actions, context } = useCommandPalette();

  return (
    <>
      {/* App content */}
      <CommandPaletteModal isOpen={isOpen} onClose={close}>
        <CommandPaletteContent
          actions={actions}
          context={context}
          onActionSelect={(action) => {
            action.execute(context);
            close();
          }}
        />
      </CommandPaletteModal>
    </>
  );
}
```

## 7. API Integration

The Command Palette itself does not directly call API endpoints. Instead, it triggers actions that may result in API calls through other mechanisms:

### Indirect API Calls (via Action Execution)

**1. Complete Current Task**
- **Endpoint:** `POST /v1/tasks/{id}/complete`
- **Request Type:** None (just task ID in path)
- **Response Type:** `CompleteTaskResponseDto`
- **Triggered By:** Action execution → calls mutation hook → API call
- **Implementation:**
  ```typescript
  const completeTaskMutation = useCompleteTaskMutation();

  completeCurrentTask: async () => {
    if (!selectedTaskId) return;
    await completeTaskMutation.mutateAsync(selectedTaskId);
  }
  ```

**2. Create Task**
- **Endpoint:** `POST /v1/tasks`
- **Request Type:** `CreateTaskRequest`
- **Response Type:** `CreateTaskResponseDto`
- **Triggered By:** Action execution → opens form → user submits → API call

**3. Create List**
- **Endpoint:** `POST /v1/lists`
- **Request Type:** `CreateListRequest`
- **Response Type:** `ListDto`
- **Triggered By:** Action execution → opens form → user submits → API call

**4. Toggle Backlog Status**
- **Endpoint:** `POST /v1/lists/{id}/toggle-backlog`
- **Request Type:** None
- **Response Type:** `ToggleBacklogResponseDto`
- **Triggered By:** Action execution → calls mutation hook → API call
- **Implementation:**
  ```typescript
  const toggleBacklogMutation = useToggleBacklogMutation();

  toggleBacklogStatus: async () => {
    if (!selectedListId) return;
    await toggleBacklogMutation.mutateAsync(selectedListId);
  }
  ```

### No Direct API Integration

The Command Palette component is purely a UI/UX layer that:
1. Displays available actions
2. Filters actions based on search
3. Executes action callbacks
4. Closes modal

Actual API calls are handled by:
- Mutation hooks (TanStack Query)
- Form submission handlers
- Action handler functions passed via context

## 8. User Interactions

### 1. Opening Command Palette

**Trigger:** User presses `Cmd+K` (or `Ctrl+K`)

**Flow:**
1. Global keyboard listener detects `Cmd+K`
2. `preventDefault()` called to override browser default
3. `openCommandPalette()` called
4. Modal appears with overlay
5. Search input autofocused
6. All available actions displayed grouped by category

**Visual Feedback:**
- Modal fades in with overlay background
- Focus indicator on search input

---

### 2. Searching for Action

**Trigger:** User types in search input

**Flow:**
1. User types characters (e.g., "cre")
2. cmdk filters actions in real-time using fuzzy matching
3. Matching actions remain visible, non-matching hidden
4. First matching action auto-selected
5. If no matches, "No results found" empty state shown

**Visual Feedback:**
- Actions filter instantly as user types
- Selected action highlighted with different background color
- Empty state appears if query matches nothing

**Fuzzy Matching Examples:**
- Query "cre" matches "**Cre**ate Task", "**Cre**ate List"
- Query "gplan" matches "**G**o to **Plan** Mode"
- Query "crtsk" matches "**Cr**eate **T**a**sk**" (forgiving matching)

---

### 3. Navigating Actions with Keyboard

**Trigger:** User presses ↓ or ↑ arrow keys

**Flow:**
1. User presses ↓ to move down list
2. Selection moves to next enabled action
3. Skips disabled actions automatically
4. Wraps to top if at bottom of list
5. User presses ↑ to move up list (reverse behavior)

**Visual Feedback:**
- Selected action has distinct background color (e.g., blue-100)
- Scroll container auto-scrolls to keep selected action in view

---

### 4. Executing Action

**Trigger:** User presses Enter or clicks action

**Flow:**
1. User selects action (keyboard or mouse)
2. `action.execute(context)` called with current context
3. Action performs operation:
   - Navigation: `navigate()` called, route changes
   - Modal: Other modal opens (Dump Mode, Help)
   - Form: Task/List creation form opens
   - API: Mutation hook triggered
4. Command palette closes automatically
5. User returned to previous view (or navigated to new view)

**Visual Feedback:**
- Modal fades out
- Navigation or modal transition occurs
- Loading state shown if API call in progress

**Example Flows:**

**Navigation Action:**
- User selects "Go to Plan Mode"
- `navigate('/app/plan')` called
- Command palette closes
- Plan Mode view loads

**Task Completion Action:**
- User selects "Complete Current Task"
- `completeCurrentTask()` called
- API request sent to `POST /v1/tasks/{id}/complete`
- Optimistic update shows task moving to Done
- Command palette closes
- Work Mode updates with next task

---

### 5. Dismissing Command Palette

**Trigger:** User presses Esc or clicks outside modal

**Flow:**
1. User presses Esc key OR clicks backdrop
2. `onClose()` called
3. Modal fades out
4. Focus returns to previous element in main view
5. Search query cleared for next opening

**Visual Feedback:**
- Modal and overlay fade out
- Previous view remains unchanged

---

### 6. Disabled Action Interaction

**Trigger:** User attempts to select disabled action

**Flow:**
1. Action rendered but visually disabled (grayed out)
2. User hovers or navigates to disabled action
3. Tooltip or visual indicator shows why action disabled
   - "Maximum 10 lists reached"
   - "No task selected"
   - "Cannot unmark last backlog"
4. Action cannot be executed (Enter has no effect)

**Visual Feedback:**
- Disabled actions have reduced opacity (opacity-50)
- Cursor shows not-allowed icon
- Optional tooltip on hover explaining why disabled

## 9. Conditions and Validation

### Action Availability Conditions

Each action has an `enabled()` function that determines whether it's available in the current context. Actions are filtered before rendering, so only enabled actions appear in the command palette.

#### Navigation Actions

**Go to Plan Mode:**
- **Condition:** Always enabled
- **Validation:** None
- **Component:** All action items (no filtering needed)

**Go to Work Mode:**
- **Condition:** Always enabled
- **Validation:** None

**Go to Done Archive:**
- **Condition:** Always enabled
- **Validation:** None

#### Task Actions

**Create Task:**
- **Condition:** Always enabled (creates in selected list or default backlog)
- **Validation:**
  - If in Plan Mode: Selected list must have < 100 tasks
  - If list at limit, action opens but form shows error
- **Component:** CommandItem for "Create Task"
- **Effect:** Action always visible, but execution may fail with validation error

**Complete Current Task:**
- **Condition:**
  - User must be in Work Mode
  - Current task must exist (selectedTaskId not null)
- **Validation:**
  ```typescript
  enabled: (ctx) => ctx.currentMode === 'work' && ctx.selectedTaskId != null
  ```
- **Component:** CommandItem (filtered out if disabled)
- **Effect:** Action hidden if not in Work Mode or no current task

#### List Actions

**Create List:**
- **Condition:** User has fewer than 10 non-Done lists
- **Validation:**
  ```typescript
  enabled: (ctx) => ctx.listCount < 10
  ```
- **Component:** CommandItem (filtered out if at limit)
- **Effect:** Action hidden when limit reached (10 lists)

**Toggle Backlog Status:**
- **Condition:**
  - User must be in Plan Mode
  - A list must be selected (selectedListId not null)
  - If unmarking, must not be last backlog
- **Validation:**
  ```typescript
  enabled: (ctx) =>
    ctx.currentMode === 'plan' &&
    ctx.selectedListId != null &&
    (ctx.isSelectedListBacklog ? ctx.backlogCount > 1 : true)
  ```
- **Component:** CommandItem (filtered out if conditions not met)
- **Effect:** Action hidden if not in Plan Mode, no list selected, or would leave zero backlogs

#### Other Actions

**Show Keyboard Shortcuts:**
- **Condition:** Always enabled
- **Validation:** None

**Open Dump Mode:**
- **Condition:** Always enabled
- **Validation:** None

### Validation Logic Implementation

**In useCommandPalette hook:**
```typescript
// Filter actions based on enabled() function
const availableActions = useMemo(() => {
  return actions.filter(action => action.enabled(context));
}, [actions, context]);
```

**In CommandPaletteContent component:**
```typescript
function CommandPaletteContent({ actions, context, onActionSelect }) {
  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups: Record<string, Action[]> = {
      navigation: [],
      tasks: [],
      lists: [],
      other: [],
    };

    actions.forEach(action => {
      if (action.enabled(context)) {
        groups[action.category].push(action);
      }
    });

    return groups;
  }, [actions, context]);

  return (
    <Command>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {Object.entries(groupedActions).map(([category, items]) => (
          items.length > 0 && (
            <CommandGroup key={category} heading={category}>
              {items.map(action => (
                <CommandItem
                  key={action.id}
                  onSelect={() => onActionSelect(action)}
                >
                  {/* Action rendering */}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        ))}
      </CommandList>
    </Command>
  );
}
```

### Error Prevention

**Scenario 1: User tries to create 11th list**
- **Prevention:** "Create List" action hidden when `listCount >= 10`
- **Fallback:** If user somehow triggers action, API returns 400 error
- **Handling:** Show inline error in Plan Mode, command palette already closed

**Scenario 2: User tries to complete task when none selected**
- **Prevention:** "Complete Current Task" action hidden when `selectedTaskId == null`
- **Fallback:** Action cannot execute, no API call made

**Scenario 3: User tries to unmark last backlog**
- **Prevention:** "Toggle Backlog Status" action disabled/hidden when it would leave zero backlogs
- **Fallback:** API enforces constraint, returns 400 error

## 10. Error Handling

### 1. Action Execution Fails (API Error)

**Scenario:** User executes action that triggers API call, but call fails (network error, validation error, server error)

**Example:**
- User selects "Complete Current Task"
- API request to `POST /v1/tasks/{id}/complete` fails with 500 error

**Handling:**
1. Command palette closes (as designed)
2. Mutation hook catches error
3. Optimistic update rolls back (if applied)
4. Inline error message appears in Work Mode view
5. User sees error context: "Failed to complete task. Please try again."
6. Retry action available in Work Mode (not in command palette)

**Implementation:**
```typescript
completeCurrentTask: async () => {
  if (!selectedTaskId) return;
  try {
    await completeTaskMutation.mutateAsync(selectedTaskId);
  } catch (error) {
    // Error handled by mutation hook's onError callback
    // Inline error shown in Work Mode view
    console.error('Failed to complete task:', error);
  }
}
```

**User Experience:**
- Modal closes immediately (optimistic UX)
- If error occurs, user sees error in main view
- Error message: "Failed to complete task. Check your connection and try again."
- No need to reopen command palette to retry

---

### 2. Invalid Context State

**Scenario:** Action depends on context that becomes invalid between modal open and execution (e.g., selected task deleted by another user/device)

**Example:**
- User opens command palette
- Sees "Complete Current Task" action (selectedTaskId = "123")
- Before selecting, task "123" deleted (sync event)
- User selects "Complete Current Task"

**Handling:**
1. Action executes with stale context
2. API returns 404 Not Found
3. Mutation hook catches error
4. Error message shown: "Task not found. It may have been deleted."
5. Work Mode refreshes task list
6. User sees updated state

**Prevention:**
- Context updates in real-time via TanStack Query
- Actions re-filtered on every context change
- Stale actions removed before user can select them

**Implementation:**
```typescript
// Context updates trigger re-filtering
const context = useMemo(() => ({
  currentMode,
  selectedTaskId, // Updates from query cache
  // ...
}), [currentMode, selectedTaskId, ...]); // Dependencies

// Actions re-filtered on context change
const availableActions = useMemo(() => {
  return actions.filter(action => action.enabled(context));
}, [actions, context]);
```

---

### 3. Keyboard Shortcut Conflicts

**Scenario:** Browser default behavior for `Cmd+K` conflicts with command palette (e.g., Chrome's "Jump to Address Bar")

**Handling:**
1. Use `preventDefault()` to override browser default
2. Document potential conflicts in keyboard help
3. Provide alternative trigger (UI button in header)

**Implementation:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault(); // Override browser default
      e.stopPropagation(); // Prevent bubbling
      open();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [open]);
```

**Alternative Access:**
- Add button in AppHeader with search icon
- Tooltip: "Command Palette (Cmd+K)"

---

### 4. Focus Management Issues

**Scenario:** User tabs out of modal or focus escapes to background view

**Handling:**
- Focus trap implemented by shadcn/ui Dialog component
- Tab key cycles within modal (doesn't escape)
- Shift+Tab reverses cycle
- If focus somehow escapes, clicking modal re-focuses input

**Implementation:**
- Use shadcn/ui Dialog component with built-in focus trap
- No custom implementation needed

---

### 5. Empty Search Results

**Scenario:** User types search query that matches no actions

**Example:**
- User types "delete" (no delete actions exist)
- No results found

**Handling:**
1. CommandEmpty component displays: "No results found."
2. User can clear search or try different query
3. No actions available to select

**User Experience:**
- Clear empty state message
- Search input remains focused for easy editing
- Backspace to clear and try again

**Implementation:**
```typescript
<CommandList>
  <CommandEmpty>No results found.</CommandEmpty>
  {/* Groups and items */}
</CommandList>
```

---

### 6. Slow Action Execution

**Scenario:** Action execution takes time (e.g., API call to complete task)

**Example:**
- User selects "Complete Current Task"
- API request takes 2-3 seconds due to slow network

**Handling:**
1. Command palette closes immediately (don't wait for API)
2. Optimistic update shows task moving to Done
3. Loading indicator shown in Work Mode (spinner or skeleton)
4. On success: Update confirmed, UI reflects new state
5. On failure: Rollback optimistic update, show error

**User Experience:**
- Instant feedback (modal closes)
- Optimistic UI update (assume success)
- Loading state if operation takes >500ms
- Error handling if operation fails

**Implementation:**
```typescript
const handleActionSelect = (action: Action) => {
  // Close modal immediately
  close();

  // Execute action (async)
  action.execute(context).catch(error => {
    // Error handled in action handler or mutation hook
  });
};
```

## 11. Implementation Steps

### Step 1: Set Up shadcn/ui Command Component

**Tasks:**
1. Install cmdk dependency: `pnpm add cmdk`
2. Add shadcn/ui Command component to project:
   ```bash
   npx shadcn-ui@latest add command
   ```
3. Verify component imports correctly from `@/components/ui/command`

**Files Created/Modified:**
- `apps/frontend/src/components/ui/command.tsx` (shadcn/ui component)
- `apps/frontend/package.json` (cmdk dependency)

---

### Step 2: Define Types and Interfaces

**Tasks:**
1. Create `types/command-palette.ts` with:
   - `Action` interface
   - `CommandPaletteContext` interface
   - `CommandPaletteModalProps` interface
   - `CommandItemProps` interface
2. Export types from types index

**Files Created:**
- `apps/frontend/src/types/command-palette.ts`

**Code:**
```typescript
// apps/frontend/src/types/command-palette.ts
export interface Action {
  id: string;
  label: string;
  description?: string;
  category: 'navigation' | 'tasks' | 'lists' | 'other';
  icon?: string;
  shortcut?: string;
  keywords?: string[];
  enabled: (context: CommandPaletteContext) => boolean;
  execute: (context: CommandPaletteContext) => void | Promise<void>;
}

export interface CommandPaletteContext {
  currentMode: 'plan' | 'work' | 'done';
  selectedListId?: string | null;
  selectedTaskId?: string | null;
  listCount: number;
  backlogCount: number;
  navigate: (path: string) => void;
  openModal: (modal: 'dump' | 'help') => void;
  openTaskCreationForm: () => void;
  completeCurrentTask: () => Promise<void>;
  openListCreationForm: () => void;
  toggleBacklogStatus: () => Promise<void>;
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CommandItemProps {
  action: Action;
  onSelect: () => void;
}
```

---

### Step 3: Create useCommandPalette Custom Hook

**Tasks:**
1. Create `hooks/useCommandPalette.ts`
2. Implement state management (isOpen)
3. Implement global keyboard listener for `Cmd+K`
4. Define all actions with enabled() and execute() functions
5. Build CommandPaletteContext from current app state
6. Return isOpen, open, close, actions, context

**Files Created:**
- `apps/frontend/src/hooks/useCommandPalette.ts`

**Implementation:**
```typescript
// apps/frontend/src/hooks/useCommandPalette.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Action, CommandPaletteContext } from '@/types/command-palette';
import { useCurrentMode } from '@/hooks/useCurrentMode';
import { useModalContext } from '@/contexts/ModalContext';
import { useKeyboardNavigationContext } from '@/contexts/KeyboardNavigationContext';
import { useListsQuery } from '@/hooks/queries/useListsQuery';
import { useCompleteTaskMutation } from '@/hooks/mutations/useCompleteTaskMutation';
import { useToggleBacklogMutation } from '@/hooks/mutations/useToggleBacklogMutation';

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const currentMode = useCurrentMode();
  const navigate = useNavigate();
  const { openModal } = useModalContext();
  const { selectedListId, selectedTaskId } = useKeyboardNavigationContext();
  const { data: listsData } = useListsQuery();
  const completeTaskMutation = useCompleteTaskMutation();
  const toggleBacklogMutation = useToggleBacklogMutation();

  const lists = listsData?.lists ?? [];
  const listCount = lists.length;
  const backlogCount = lists.filter(l => l.isBacklog).length;

  const context: CommandPaletteContext = useMemo(() => ({
    currentMode,
    selectedListId,
    selectedTaskId,
    listCount,
    backlogCount,
    navigate,
    openModal,
    openTaskCreationForm: () => {
      // TODO: Implement task creation form trigger
      console.log('Open task creation form');
    },
    completeCurrentTask: async () => {
      if (!selectedTaskId) return;
      await completeTaskMutation.mutateAsync(selectedTaskId);
    },
    openListCreationForm: () => {
      // TODO: Implement list creation form trigger
      console.log('Open list creation form');
    },
    toggleBacklogStatus: async () => {
      if (!selectedListId) return;
      await toggleBacklogMutation.mutateAsync(selectedListId);
    },
  }), [
    currentMode,
    selectedListId,
    selectedTaskId,
    listCount,
    backlogCount,
    navigate,
    openModal,
    completeTaskMutation,
    toggleBacklogMutation,
  ]);

  const actions: Action[] = useMemo(() => [
    // Navigation
    {
      id: 'go-to-plan',
      label: 'Go to Plan Mode',
      category: 'navigation',
      icon: 'LayoutGrid',
      shortcut: 'Cmd+P',
      keywords: ['plan', 'board', 'lists'],
      enabled: () => true,
      execute: (ctx) => ctx.navigate('/app/plan'),
    },
    {
      id: 'go-to-work',
      label: 'Go to Work Mode',
      category: 'navigation',
      icon: 'Play',
      shortcut: 'Cmd+W',
      keywords: ['work', 'focus', 'execute'],
      enabled: () => true,
      execute: (ctx) => ctx.navigate('/app/work'),
    },
    {
      id: 'go-to-done',
      label: 'Go to Done Archive',
      category: 'navigation',
      icon: 'Archive',
      shortcut: 'Cmd+Shift+A',
      keywords: ['done', 'archive', 'completed'],
      enabled: () => true,
      execute: (ctx) => ctx.navigate('/app/done'),
    },

    // Tasks
    {
      id: 'create-task',
      label: 'Create Task',
      category: 'tasks',
      icon: 'Plus',
      shortcut: 'n',
      keywords: ['new', 'add', 'task', 'create'],
      enabled: () => true,
      execute: (ctx) => ctx.openTaskCreationForm(),
    },
    {
      id: 'complete-task',
      label: 'Complete Current Task',
      category: 'tasks',
      icon: 'Check',
      shortcut: 'Space',
      keywords: ['complete', 'done', 'finish'],
      enabled: (ctx) => ctx.currentMode === 'work' && ctx.selectedTaskId != null,
      execute: (ctx) => ctx.completeCurrentTask(),
    },

    // Lists
    {
      id: 'create-list',
      label: 'Create List',
      category: 'lists',
      icon: 'PlusCircle',
      shortcut: 'l',
      keywords: ['new', 'add', 'list', 'create'],
      enabled: (ctx) => ctx.listCount < 10,
      execute: (ctx) => ctx.openListCreationForm(),
    },
    {
      id: 'toggle-backlog',
      label: 'Toggle Backlog Status',
      category: 'lists',
      icon: 'Star',
      keywords: ['backlog', 'toggle', 'mark'],
      enabled: (ctx) =>
        ctx.currentMode === 'plan' &&
        ctx.selectedListId != null &&
        ctx.backlogCount > 1,
      execute: (ctx) => ctx.toggleBacklogStatus(),
    },

    // Other
    {
      id: 'show-shortcuts',
      label: 'Show Keyboard Shortcuts',
      category: 'other',
      icon: 'Keyboard',
      shortcut: '?',
      keywords: ['help', 'shortcuts', 'keyboard', 'keys'],
      enabled: () => true,
      execute: (ctx) => ctx.openModal('help'),
    },
    {
      id: 'open-dump-mode',
      label: 'Open Dump Mode',
      category: 'other',
      icon: 'FileText',
      shortcut: 'Cmd+Shift+D',
      keywords: ['dump', 'bulk', 'add', 'quick'],
      enabled: () => true,
      execute: (ctx) => ctx.openModal('dump'),
    },
  ], []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        open();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return {
    isOpen,
    open,
    close,
    actions,
    context,
  };
}
```

---

### Step 4: Create CommandPaletteModal Component

**Tasks:**
1. Create modal container with overlay backdrop
2. Implement Dialog from shadcn/ui with focus trap
3. Handle Esc key and outside click to close
4. Autofocus search input on open

**Files Created:**
- `apps/frontend/src/components/CommandPalette/CommandPaletteModal.tsx`

**Implementation:**
```typescript
// apps/frontend/src/components/CommandPalette/CommandPaletteModal.tsx
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CommandPaletteModalProps } from '@/types/command-palette';

export function CommandPaletteModal({
  isOpen,
  onClose,
  children
}: CommandPaletteModalProps & { children: React.ReactNode }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0">
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 5: Create CommandPaletteContent Component

**Tasks:**
1. Render Command component from shadcn/ui
2. Filter actions by enabled() function
3. Group actions by category
4. Handle action selection and execution
5. Render CommandInput, CommandList, CommandGroup, CommandItem

**Files Created:**
- `apps/frontend/src/components/CommandPalette/CommandPaletteContent.tsx`

**Implementation:**
```typescript
// apps/frontend/src/components/CommandPalette/CommandPaletteContent.tsx
import { useMemo } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Action, CommandPaletteContext } from '@/types/command-palette';
import * as Icons from 'lucide-react';

interface CommandPaletteContentProps {
  actions: Action[];
  context: CommandPaletteContext;
  onActionSelect: (action: Action) => void;
}

export function CommandPaletteContent({
  actions,
  context,
  onActionSelect
}: CommandPaletteContentProps) {
  // Group actions by category, filtering by enabled()
  const groupedActions = useMemo(() => {
    const groups: Record<string, Action[]> = {
      navigation: [],
      tasks: [],
      lists: [],
      other: [],
    };

    actions.forEach(action => {
      if (action.enabled(context)) {
        groups[action.category].push(action);
      }
    });

    return groups;
  }, [actions, context]);

  const categoryLabels = {
    navigation: 'Navigation',
    tasks: 'Tasks',
    lists: 'Lists',
    other: 'Other',
  };

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {Object.entries(groupedActions).map(([category, items]) => {
          if (items.length === 0) return null;

          return (
            <CommandGroup
              key={category}
              heading={categoryLabels[category as keyof typeof categoryLabels]}
            >
              {items.map(action => {
                const Icon = action.icon
                  ? Icons[action.icon as keyof typeof Icons]
                  : null;

                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => onActionSelect(action)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{action.label}</span>
                    </div>
                    {action.shortcut && (
                      <kbd className="ml-auto text-xs text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </Command>
  );
}
```

---

### Step 6: Integrate Command Palette into AppShell

**Tasks:**
1. Import useCommandPalette hook in AppShell
2. Render CommandPaletteModal with isOpen and onClose props
3. Pass actions and context to CommandPaletteContent
4. Handle action selection (execute and close)

**Files Modified:**
- `apps/frontend/src/components/AppShell.tsx`

**Implementation:**
```typescript
// apps/frontend/src/components/AppShell.tsx
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { CommandPaletteModal } from '@/components/CommandPalette/CommandPaletteModal';
import { CommandPaletteContent } from '@/components/CommandPalette/CommandPaletteContent';

export function AppShell() {
  const { isOpen, close, actions, context } = useCommandPalette();

  const handleActionSelect = (action: Action) => {
    // Execute action
    action.execute(context);

    // Close modal
    close();
  };

  return (
    <>
      {/* App header, routes, etc. */}

      <CommandPaletteModal isOpen={isOpen} onClose={close}>
        <CommandPaletteContent
          actions={actions}
          context={context}
          onActionSelect={handleActionSelect}
        />
      </CommandPaletteModal>
    </>
  );
}
```

---

### Step 7: Add Keyboard Shortcut Hints to Actions

**Tasks:**
1. Review all action definitions
2. Add shortcut property to each action where applicable
3. Ensure shortcut hints display correctly in CommandItem

**Files Modified:**
- `apps/frontend/src/hooks/useCommandPalette.ts` (already done in Step 3)

---

### Step 8: Test Keyboard Navigation

**Tasks:**
1. Open command palette with `Cmd+K`
2. Verify search input autofocused
3. Test ↑↓ arrow navigation
4. Test Enter key to execute action
5. Test Esc key to close
6. Test click outside to close
7. Test focus trap (Tab doesn't escape modal)

**Manual Testing Checklist:**
- [ ] `Cmd+K` opens modal
- [ ] Search input autofocused
- [ ] ↓ navigates down
- [ ] ↑ navigates up
- [ ] Enter executes selected action
- [ ] Esc closes modal
- [ ] Click backdrop closes modal
- [ ] Tab cycles within modal only
- [ ] Focus returns to previous element on close

---

### Step 9: Test Fuzzy Search

**Tasks:**
1. Type partial queries (e.g., "cre")
2. Verify actions filter correctly
3. Test misspellings and abbreviations
4. Verify empty state shows when no matches

**Manual Testing Checklist:**
- [ ] "cre" matches "Create Task" and "Create List"
- [ ] "gplan" matches "Go to Plan Mode"
- [ ] "comp" matches "Complete Current Task"
- [ ] "xyz" shows "No results found"
- [ ] Search clears on modal reopen

---

### Step 10: Test Action Execution

**Tasks:**
1. Select each action type and verify behavior:
   - Navigation actions → route changes
   - Task actions → forms open or API calls
   - List actions → forms open or API calls
   - Other actions → modals open
2. Verify modal closes after action executes
3. Test error handling for failed API calls

**Manual Testing Checklist:**
- [ ] "Go to Plan Mode" navigates correctly
- [ ] "Go to Work Mode" navigates correctly
- [ ] "Go to Done Archive" navigates correctly
- [ ] "Create Task" opens task form
- [ ] "Complete Current Task" completes task (Work Mode only)
- [ ] "Create List" opens list form
- [ ] "Toggle Backlog Status" toggles backlog (Plan Mode only)
- [ ] "Show Keyboard Shortcuts" opens help modal
- [ ] "Open Dump Mode" opens dump mode modal
- [ ] Modal closes after each action

---

### Step 11: Test Conditional Action Availability

**Tasks:**
1. Verify "Complete Current Task" only shown in Work Mode
2. Verify "Create List" hidden when 10 lists exist
3. Verify "Toggle Backlog Status" hidden when unmarking last backlog
4. Verify actions update when context changes

**Manual Testing Checklist:**
- [ ] "Complete Current Task" shown in Work Mode, hidden in Plan/Done
- [ ] "Create List" hidden when 10 lists exist
- [ ] "Toggle Backlog Status" hidden when no list selected
- [ ] "Toggle Backlog Status" hidden when unmarking last backlog
- [ ] Actions update when switching modes
- [ ] Actions update when selecting/deselecting lists

---

### Step 12: Accessibility Testing

**Tasks:**
1. Test screen reader announcements
2. Verify ARIA attributes correct
3. Test keyboard-only navigation
4. Verify focus management

**Accessibility Checklist:**
- [ ] Modal has `role="dialog"` and `aria-modal="true"`
- [ ] Search input has `role="combobox"`
- [ ] Results list has `role="listbox"`
- [ ] Selected action has `aria-selected="true"`
- [ ] Screen reader announces search results count
- [ ] Screen reader announces selected action
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicator visible on all elements

---

### Step 13: Error Handling Integration

**Tasks:**
1. Test API errors (complete task, toggle backlog)
2. Verify errors shown inline in relevant views
3. Test network failure scenarios
4. Verify optimistic updates rollback on error

**Error Testing Checklist:**
- [ ] Failed complete task shows error in Work Mode
- [ ] Failed toggle backlog shows error in Plan Mode
- [ ] Network errors handled gracefully
- [ ] Optimistic updates rollback on error
- [ ] Error messages clear and actionable

---

### Step 14: Styling and Polish

**Tasks:**
1. Review command palette styling
2. Ensure consistent with app design system
3. Add hover/focus states
4. Optimize for mobile (if needed)
5. Add transitions/animations

**Styling Checklist:**
- [ ] Modal overlay background color and opacity
- [ ] Command palette width and max-width
- [ ] Search input styling (border, padding, focus ring)
- [ ] Action item hover state
- [ ] Action item selected state
- [ ] Keyboard shortcut badge styling
- [ ] Empty state styling
- [ ] Category heading styling
- [ ] Smooth open/close transitions

---

### Step 15: Documentation

**Tasks:**
1. Document component usage in component files
2. Add JSDoc comments to functions
3. Update keyboard shortcuts help modal with `Cmd+K`
4. Add command palette section to user documentation (if exists)

**Documentation Checklist:**
- [ ] Component usage documented
- [ ] Hook usage documented
- [ ] Types documented
- [ ] Keyboard shortcuts help updated
- [ ] README updated (if applicable)

---

### Step 16: Final Integration Testing

**Tasks:**
1. Test command palette in all modes (Plan, Work, Done)
2. Test with different data states (empty lists, full lists, etc.)
3. Test with different user actions (creating, completing, etc.)
4. Verify no regressions in existing features

**Integration Testing Checklist:**
- [ ] Command palette works in Plan Mode
- [ ] Command palette works in Work Mode
- [ ] Command palette works in Done Archive
- [ ] Works with empty state (no tasks/lists)
- [ ] Works with limit states (10 lists, 100 tasks)
- [ ] No conflicts with existing keyboard shortcuts
- [ ] No performance issues with large datasets
- [ ] No visual glitches or layout issues

---

## Summary

This implementation plan provides a comprehensive guide for building the Command Palette Modal. The component leverages shadcn/ui's Command component for robust keyboard navigation and fuzzy search, integrates seamlessly with the existing app architecture, and maintains full accessibility compliance. By following these steps sequentially, you'll create a professional, user-friendly command palette that enhances the GSD application's keyboard-first workflow.

**Key Success Factors:**
- Use shadcn/ui Command component (don't reinvent the wheel)
- Filter actions based on context (enabled() function)
- Close modal immediately on action selection for snappy UX
- Handle errors gracefully in main views, not in command palette
- Test thoroughly with keyboard-only navigation
- Maintain ARIA attributes for screen reader support
