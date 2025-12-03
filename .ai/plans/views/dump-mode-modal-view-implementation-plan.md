# View Implementation Plan: Dump Mode Modal

## 1. Overview

The Dump Mode Modal is a keyboard-triggered modal overlay that enables quick multi-line task creation. Users can paste or type up to 10 task titles (one per line) and add them to a selected backlog list. The modal is accessible from any authenticated view via the `Cmd+Shift+D` keyboard shortcut.

**Key Features:**
- Multi-line textarea input (max 10 lines)
- Backlog selector dropdown with last-used memory
- Real-time line counter with validation
- Automatic blank line removal
- Focus trap and keyboard navigation
- Non-blocking modal that returns user to previous view after submission

## 2. View Routing

**View Path:** N/A (Modal overlay, not a standalone route)

**Access Method:** Global keyboard shortcut `Cmd+Shift+D` from any authenticated view (`/app/*`)

**Modal State Management:** Controlled via React state in parent component or global modal state provider

## 3. Component Structure

```
<DumpModeModal>
├── <Dialog> (shadcn/ui)
│   ├── <DialogOverlay>
│   └── <DialogContent>
│       ├── <DialogHeader>
│       │   ├── <DialogTitle>
│       │   └── <DialogClose> (X button)
│       └── <DumpModeForm>
│           ├── <FormField name="taskLines">
│           │   ├── <Label>
│           │   ├── <Textarea>
│           │   ├── <LineCounter>
│           │   └── <FormMessage> (error)
│           ├── <FormField name="targetListId">
│           │   ├── <Label>
│           │   └── <BacklogSelector>
│           │       └── <Select> (shadcn/ui)
│           │           ├── <SelectTrigger>
│           │           │   └── <BacklogColorIndicator>
│           │           └── <SelectContent>
│           │               └── <SelectItem> (for each backlog)
│           │                   └── <BacklogColorIndicator>
│           └── <DialogFooter>
│               ├── <CancelButton>
│               └── <SubmitButton>
```

## 4. Component Details

### 4.1 DumpModeModal

**Component Description:**
Top-level modal component that wraps the Dialog and manages global modal state (open/close). Listens for `Cmd+Shift+D` keyboard shortcut to open.

**Main Elements:**
- shadcn/ui `<Dialog>` component
- Keyboard event listener for `Cmd+Shift+D`
- Modal state management (isOpen)

**Handled Interactions:**
- Global keyboard shortcut `Cmd+Shift+D` to open modal
- Esc key to close modal
- Click outside modal to close
- X button click to close

**Handled Validation:**
- N/A (handled in child form component)

**Types:**
- None (uses primitive boolean for isOpen state)

**Props:**
```typescript
interface DumpModeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### 4.2 DumpModeForm

**Component Description:**
Form component containing textarea, backlog selector, and action buttons. Manages form state, validation, and submission to the bulk-add API endpoint.

**Main Elements:**
- `<form>` element with react-hook-form
- Multi-line `<Textarea>` for task titles
- `<BacklogSelector>` dropdown
- Line counter display
- Submit and Cancel buttons

**Handled Interactions:**
- Textarea input with line counting
- Enter or Cmd+Enter to submit (if ≤10 lines)
- Esc to cancel
- Backlog selection from dropdown
- Submit button click
- Cancel button click

**Handled Validation:**
- Maximum 10 non-empty lines (real-time check)
- At least 1 non-empty line required
- Each line max 500 characters (per task title limit)
- Target backlog required

**Types:**
- `DumpModeFormData` (view model for form state)
- `BulkAddTasksRequest` (API request DTO)
- `BulkAddTasksResponseDto` (API response DTO)
- `ListDto` (for backlog list data)

**Props:**
```typescript
interface DumpModeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}
```

### 4.3 Textarea (Task Lines Input)

**Component Description:**
Multi-line text input (shadcn/ui Textarea) for entering task titles, one per line. Autofocused on modal open.

**Main Elements:**
- shadcn/ui `<Textarea>` component
- Placeholder text: "Enter task titles (one per line, max 10)"
- Character counter (optional)

**Handled Interactions:**
- Text input (typing, pasting)
- Enter key (new line, unless at submit limit)
- Cmd+Enter (submit form)

**Handled Validation:**
- Max 10 lines (disable submit if exceeded)
- Real-time line count update
- Max 500 characters per line (task title limit)

**Types:**
- `string` (controlled input value)

**Props:**
```typescript
interface TaskLinesTextareaProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus: boolean;
  placeholder: string;
  maxLines: number; // 10
}
```

### 4.4 LineCounter

**Component Description:**
Real-time counter displaying current line count vs maximum (e.g., "5/10 lines"). Changes color based on proximity to limit.

**Main Elements:**
- `<div>` or `<span>` with styled text
- Conditional color coding (green < 8, yellow 8-9, red ≥10)

**Handled Interactions:**
- None (read-only display)

**Handled Validation:**
- N/A (displays validation state)

**Types:**
- None (receives primitive numbers as props)

**Props:**
```typescript
interface LineCounterProps {
  currentCount: number;
  maxCount: number; // 10
}
```

### 4.5 BacklogSelector

**Component Description:**
Dropdown selector (shadcn/ui Select) for choosing target backlog. Pre-selects last used backlog (stored in localStorage). Displays backlog name and color indicator.

**Main Elements:**
- shadcn/ui `<Select>` component
- `<SelectTrigger>` showing selected backlog name and color
- `<SelectContent>` with list of backlogs
- `<SelectItem>` for each backlog with color indicator

**Handled Interactions:**
- Dropdown open/close
- Backlog selection (keyboard or mouse)
- Remembers last selection in localStorage

**Handled Validation:**
- Target backlog required (cannot be null)
- Only backlogs shown (filter out intermediate lists and Done)

**Types:**
- `ListDto[]` (array of backlog lists)
- `string` (selected backlog ID)

**Props:**
```typescript
interface BacklogSelectorProps {
  backlogs: ListDto[];
  selectedBacklogId: string | null;
  onSelect: (backlogId: string) => void;
}
```

### 4.6 BacklogColorIndicator

**Component Description:**
Small visual indicator showing backlog color (4px circle or left border). Appears in both the select trigger and each select item.

**Main Elements:**
- `<div>` with background color or border-left color
- 4px width/height for circle, or 4px border-left

**Handled Interactions:**
- None (visual only)

**Handled Validation:**
- N/A

**Types:**
- None (receives color string as prop)

**Props:**
```typescript
interface BacklogColorIndicatorProps {
  color: string; // hex color from backlog
}
```

### 4.7 SubmitButton

**Component Description:**
Primary action button to submit tasks. Displays dynamic label with selected backlog name (e.g., "Add to Work"). Disabled if validation fails.

**Main Elements:**
- shadcn/ui `<Button>` (variant="default")
- Dynamic label text
- Loading state during submission

**Handled Interactions:**
- Click to submit form
- Disabled if >10 lines or 0 lines
- Shows loading spinner during API call

**Handled Validation:**
- Disabled if line count > 10
- Disabled if line count = 0
- Disabled during submission (loading state)

**Types:**
- None (primitive boolean for disabled/loading)

**Props:**
```typescript
interface SubmitButtonProps {
  isDisabled: boolean;
  isLoading: boolean;
  backlogName: string;
  onClick: () => void;
}
```

### 4.8 CancelButton

**Component Description:**
Secondary action button to close modal without submitting. Also responds to Esc key.

**Main Elements:**
- shadcn/ui `<Button>` (variant="outline")
- Label: "Cancel"

**Handled Interactions:**
- Click to cancel and close modal
- Esc key (handled at modal level)

**Handled Validation:**
- N/A

**Types:**
- None

**Props:**
```typescript
interface CancelButtonProps {
  onClick: () => void;
}
```

## 5. Types

### 5.1 View Models (New Types)

```typescript
// Form state for Dump Mode
interface DumpModeFormData {
  taskLines: string; // Raw textarea value (multi-line string)
  targetListId: string; // Selected backlog ID
}

// Parsed form data ready for API submission
interface ParsedDumpModeData {
  lines: string[]; // Array of non-empty task titles
  targetListId: string;
}

// Local storage key for last used backlog
const LAST_USED_BACKLOG_KEY = 'dump-mode-last-backlog';
```

### 5.2 API DTOs (Existing Types from @gsd/types)

```typescript
// Request DTO (from packages/types/src/api/tasks.ts)
interface BulkAddTasksRequest {
  tasks: Array<{
    title: string;
    description?: string;
  }>;
  listId?: string; // Target list ID (optional, defaults to default backlog)
}

// Response DTO (from packages/types/src/api/tasks.ts)
interface BulkAddTasksResponseDto {
  tasks: TaskDto[];
  created: number;
  failed: number;
  message?: string;
}

// List DTO (from packages/types/src/api/lists.ts)
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

// Task DTO (from packages/types/src/api/tasks.ts)
interface TaskDto {
  id: string;
  userId: string;
  listId: string;
  originBacklogId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  color: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt: Date | null;
}
```

### 5.3 Validation Schema (Zod)

```typescript
import { z } from 'zod';

// Zod schema for form validation
const dumpModeFormSchema = z.object({
  taskLines: z.string()
    .min(1, 'Please enter at least one task')
    .refine(
      (value) => {
        const lines = value.split('\n').filter(line => line.trim() !== '');
        return lines.length <= 10;
      },
      { message: 'Maximum 10 tasks allowed' }
    )
    .refine(
      (value) => {
        const lines = value.split('\n').filter(line => line.trim() !== '');
        return lines.every(line => line.length <= 500);
      },
      { message: 'Each task title must be 500 characters or less' }
    ),
  targetListId: z.string().uuid('Please select a backlog'),
});

type DumpModeFormData = z.infer<typeof dumpModeFormSchema>;
```

## 6. State Management

### 6.1 Modal State

**Modal Open/Close State:**
- Managed in global app state or parent component (e.g., AppShell)
- Uses React state: `const [isDumpModeOpen, setIsDumpModeOpen] = useState(false);`
- Global keyboard listener in AppShell or custom hook triggers `setIsDumpModeOpen(true)`

**Keyboard Shortcut Hook:**
```typescript
// Custom hook for global keyboard shortcuts
function useGlobalKeyboardShortcut(
  key: string,
  modifiers: { cmd?: boolean; shift?: boolean },
  callback: () => void
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdPressed = e.metaKey || e.ctrlKey;
      const isShiftPressed = e.shiftKey;

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        (!modifiers.cmd || isCmdPressed) &&
        (!modifiers.shift || isShiftPressed)
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, modifiers, callback]);
}

// Usage in AppShell or root component
useGlobalKeyboardShortcut('d', { cmd: true, shift: true }, () => {
  setIsDumpModeOpen(true);
});
```

### 6.2 Form State

**Form State Management:**
- Uses `react-hook-form` with `useForm` hook
- Default values loaded from localStorage (last used backlog)
- Form reset on successful submission

**Form Hook Setup:**
```typescript
const form = useForm<DumpModeFormData>({
  resolver: zodResolver(dumpModeFormSchema),
  defaultValues: {
    taskLines: '',
    targetListId: getLastUsedBacklog() || backlogs[0]?.id || '',
  },
});
```

### 6.3 Backlog Data Fetching

**Data Source:**
- TanStack Query hook: `useListsQuery()` to fetch all lists
- Filter backlogs client-side: `lists.filter(list => list.isBacklog && !list.isDone)`
- Cache backlogs in query cache (no need for local state)

**Custom Hook:**
```typescript
function useBacklogs() {
  const { data: lists = [], isLoading } = useListsQuery();
  const backlogs = lists.filter(list => list.isBacklog && !list.isDone);
  return { backlogs, isLoading };
}
```

### 6.4 Last Used Backlog (localStorage)

**LocalStorage Persistence:**
- Key: `'dump-mode-last-backlog'`
- Stores selected backlog ID
- Retrieved on modal open to pre-select dropdown
- Updated on successful submission

**Helper Functions:**
```typescript
function getLastUsedBacklog(): string | null {
  return localStorage.getItem('dump-mode-last-backlog');
}

function setLastUsedBacklog(backlogId: string): void {
  localStorage.setItem('dump-mode-last-backlog', backlogId);
}
```

### 6.5 Line Counting (Derived State)

**Real-Time Line Count:**
- Derived from textarea value (not stored in state)
- Computed on every render based on current textarea value
- Filters out empty lines for accurate count

**Helper Function:**
```typescript
function getLineCount(text: string): number {
  return text.split('\n').filter(line => line.trim() !== '').length;
}

// Usage in component
const lineCount = getLineCount(form.watch('taskLines'));
```

## 7. API Integration

### 7.1 Endpoint

**API Endpoint:** `POST /v1/tasks/bulk-add`

**Request Type:** `BulkAddTasksRequest`
```typescript
{
  tasks: Array<{
    title: string;
    description?: string;
  }>;
  listId?: string; // Target backlog ID
}
```

**Response Type:** `BulkAddTasksResponseDto`
```typescript
{
  tasks: TaskDto[];
  created: number;
  failed: number;
  message?: string;
}
```

### 7.2 Mutation Hook (TanStack Query)

**Custom Hook:**
```typescript
function useBulkAddTasksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkAddTasksRequest) => {
      const response = await fetch('/v1/tasks/bulk-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include', // Include JWT cookie
      });

      if (!response.ok) {
        throw new Error('Failed to add tasks');
      }

      return response.json() as Promise<BulkAddTasksResponseDto>;
    },
    onSuccess: (data) => {
      // Invalidate tasks and lists queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}
```

### 7.3 Form Submission Flow

**Submission Process:**
1. User clicks Submit button or presses Cmd+Enter
2. Form validation runs (zod schema)
3. If valid, parse textarea into array of task titles
4. Remove blank lines
5. Build `BulkAddTasksRequest` object
6. Call mutation hook
7. Show loading state on Submit button
8. On success:
   - Save selected backlog to localStorage
   - Invalidate TanStack Query caches
   - Close modal
   - Show success feedback (optional toast or inline message)
9. On error:
   - Display error message inline
   - Keep modal open for retry

**Implementation:**
```typescript
const { mutate, isPending, isError, error } = useBulkAddTasksMutation();

const onSubmit = (data: DumpModeFormData) => {
  // Parse lines and remove blanks
  const lines = data.taskLines
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

  // Build request
  const request: BulkAddTasksRequest = {
    tasks: lines.map(line => ({ title: line })),
    listId: data.targetListId,
  };

  // Submit mutation
  mutate(request, {
    onSuccess: (response) => {
      setLastUsedBacklog(data.targetListId);
      onModalClose();
      // Optional: show success message
      console.log(`Created ${response.created} tasks`);
    },
    onError: (err) => {
      console.error('Failed to add tasks:', err);
      // Error displayed via isError/error state
    },
  });
};
```

## 8. User Interactions

### 8.1 Opening the Modal

**Trigger:** Global keyboard shortcut `Cmd+Shift+D` from any authenticated view

**Behavior:**
1. User presses `Cmd+Shift+D`
2. Modal overlay appears with backdrop
3. Textarea is autofocused
4. Cursor positioned in textarea
5. Previous view dimmed but visible in background

### 8.2 Entering Task Titles

**Interaction:** User types or pastes task titles into textarea (one per line)

**Behavior:**
1. User types or pastes text
2. Line counter updates in real-time
3. If >10 lines detected:
   - Submit button disabled
   - Error message shown below textarea: "Maximum 10 tasks allowed"
4. If ≤10 lines:
   - Submit button enabled
   - No error message

### 8.3 Selecting Target Backlog

**Interaction:** User clicks backlog dropdown and selects a backlog

**Behavior:**
1. User clicks dropdown trigger
2. Dropdown opens with list of backlogs
3. Each item shows backlog name and color indicator
4. User selects backlog (click or keyboard)
5. Dropdown closes
6. Selected backlog shown in trigger
7. Submit button label updates: "Add to [Backlog Name]"

### 8.4 Submitting Tasks

**Interaction:** User clicks Submit button or presses Cmd+Enter (if valid)

**Behavior:**
1. Form validation runs
2. If invalid: error messages shown, submission blocked
3. If valid:
   - Submit button shows loading spinner
   - API call sent
   - On success:
     - Modal closes
     - Tasks appear at top of selected backlog
     - User returned to previous view
     - Optional success message (e.g., "5 tasks added to Work")
   - On error:
     - Error message shown inline
     - Modal remains open
     - Retry button or manual retry available

### 8.5 Canceling

**Interaction:** User clicks Cancel button, presses Esc, or clicks outside modal

**Behavior:**
1. Modal closes immediately
2. Form data discarded (not saved)
3. User returned to previous view
4. No API calls made

## 9. Conditions and Validation

### 9.1 Line Count Validation

**Condition:** User must enter between 1 and 10 non-empty lines

**Validation:**
- Real-time: Count non-empty lines on every textarea change
- Display line counter: "X/10 lines"
- Color coding:
  - Green (0-7 lines): Normal
  - Yellow (8-9 lines): Approaching limit
  - Red (10 lines): At limit
  - Red + error (>10 lines): Exceeded limit

**Component Affected:** DumpModeForm, Textarea, LineCounter, SubmitButton

**UI State:**
- Submit button disabled if 0 lines or >10 lines
- Error message shown if >10 lines: "Maximum 10 tasks allowed"

### 9.2 Task Title Length Validation

**Condition:** Each task title (line) must be ≤500 characters

**Validation:**
- Checked on submission (zod schema)
- If any line exceeds 500 chars, show error: "Each task title must be 500 characters or less"

**Component Affected:** DumpModeForm, Textarea

**UI State:**
- Error message shown below textarea
- Submission blocked until fixed

### 9.3 Target Backlog Required

**Condition:** User must select a target backlog (cannot be null or empty)

**Validation:**
- Pre-selected on modal open (last used or first backlog)
- Dropdown always has a value (cannot deselect)
- If no backlogs exist (edge case), show error: "No backlogs available. Create a backlog first."

**Component Affected:** BacklogSelector, DumpModeForm

**UI State:**
- If no backlogs, disable Submit button and show error message
- Modal should not open if no backlogs exist (prevented at trigger level)

### 9.4 Blank Line Handling

**Condition:** Blank lines (empty or whitespace-only) are automatically removed before submission

**Validation:**
- Not an error; handled silently
- Line counter only counts non-empty lines
- Backend receives only non-empty task titles

**Component Affected:** DumpModeForm (submission logic)

**UI State:**
- No UI indication; transparent to user

### 9.5 Duplicate Task Titles

**Condition:** Duplicate task titles are allowed (no deduplication)

**Validation:**
- No validation; duplicates permitted per PRD

**Component Affected:** N/A

**UI State:**
- No UI indication

## 10. Error Handling

### 10.1 API Errors

**Scenario:** Backend returns 400 (validation error) or 500 (server error)

**Handling:**
1. Catch error in mutation `onError` callback
2. Display inline error message below form: "Failed to add tasks. Please try again."
3. Keep modal open for user to retry
4. Log error to console for debugging
5. Optionally show specific error message from API response

**User Recovery:**
- User can edit form and retry submission
- User can cancel and close modal

### 10.2 Network Errors

**Scenario:** Network connection lost during submission

**Handling:**
1. Mutation fails with network error
2. Display error message: "Network error. Check your connection and try again."
3. Provide Retry button or allow manual retry

**User Recovery:**
- User can click Retry when connection restored
- User can cancel and retry later

### 10.3 No Backlogs Available

**Scenario:** User has no backlog lists (edge case, should be prevented by onboarding)

**Handling:**
1. Detect no backlogs before opening modal
2. Show error message in modal: "No backlogs available. Create a backlog first to use Dump Mode."
3. Disable Submit button
4. Provide link or button to close modal and navigate to Plan Mode

**Prevention:**
- Check backlog count before allowing modal to open
- If no backlogs, show alert or toast instead of opening modal

### 10.4 Form Validation Errors

**Scenario:** User attempts to submit with invalid data (e.g., >10 lines, no task titles)

**Handling:**
1. Form validation blocks submission
2. Display error messages below relevant fields:
   - Textarea: "Maximum 10 tasks allowed" or "Please enter at least one task"
   - Backlog selector: "Please select a backlog"
3. Submit button remains disabled
4. Errors clear when user corrects input

**User Recovery:**
- User edits input to fix errors
- Errors clear automatically
- Submit button re-enables when valid

### 10.5 Unexpected Errors (Error Boundary)

**Scenario:** React error in modal component (bug)

**Handling:**
1. Error boundary catches error
2. Display fallback UI: "Something went wrong. Please close and try again."
3. Provide Close button to dismiss modal
4. Log error for debugging

**User Recovery:**
- User closes modal
- User can reopen modal to retry
- If error persists, user can use alternative method (create tasks manually in Plan Mode)

## 11. Implementation Steps

### Step 1: Set Up Modal Component Shell

**Tasks:**
1. Create `DumpModeModal.tsx` component file in `apps/frontend/src/components/modals/`
2. Import shadcn/ui Dialog components: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogClose`
3. Add props: `isOpen`, `onOpenChange`
4. Implement basic modal structure with overlay and content
5. Add accessibility attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
6. Test modal open/close behavior

**Acceptance Criteria:**
- Modal opens and closes correctly
- Modal is accessible (screen reader announces title)
- Focus trapped within modal when open

---

### Step 2: Add Global Keyboard Shortcut Listener

**Tasks:**
1. Create `useGlobalKeyboardShortcut` custom hook in `apps/frontend/src/hooks/`
2. Implement keyboard event listener for `Cmd+Shift+D`
3. Integrate hook in `AppShell` or root authenticated component
4. Connect keyboard shortcut to modal state: `setIsDumpModeOpen(true)`
5. Test shortcut from different views (Plan, Work, Done)

**Acceptance Criteria:**
- `Cmd+Shift+D` opens modal from any authenticated view
- Shortcut prevented from triggering browser defaults
- Modal opens immediately on keypress

---

### Step 3: Create Form Component with Textarea

**Tasks:**
1. Create `DumpModeForm.tsx` component in `apps/frontend/src/components/modals/`
2. Set up react-hook-form with `useForm` hook
3. Add zod validation schema for `taskLines` field
4. Add shadcn/ui Textarea component for task input
5. Set `autoFocus` prop on Textarea
6. Add placeholder text: "Enter task titles (one per line, max 10)"
7. Connect Textarea to form state with `register` or `Controller`

**Acceptance Criteria:**
- Textarea autofocused on modal open
- Textarea accepts multi-line input
- Form state updates as user types

---

### Step 4: Implement Real-Time Line Counter

**Tasks:**
1. Create `LineCounter.tsx` component in `apps/frontend/src/components/modals/`
2. Add `getLineCount` helper function to count non-empty lines
3. Use `form.watch('taskLines')` to get current textarea value
4. Pass line count to `LineCounter` component
5. Implement color coding logic (green, yellow, red)
6. Display counter: "X/10 lines"

**Acceptance Criteria:**
- Line counter updates in real-time as user types
- Only non-empty lines counted
- Color changes based on proximity to limit

---

### Step 5: Add Backlog Selector Dropdown

**Tasks:**
1. Create `BacklogSelector.tsx` component in `apps/frontend/src/components/modals/`
2. Fetch backlogs using `useListsQuery` hook and filter for `isBacklog: true`
3. Implement shadcn/ui Select component
4. Add `SelectItem` for each backlog with name and color indicator
5. Create `BacklogColorIndicator.tsx` component for color display
6. Set default value to last used backlog (from localStorage) or first backlog

**Acceptance Criteria:**
- Dropdown displays all backlogs with colors
- Last used backlog pre-selected on modal open
- User can select different backlog via keyboard or mouse

---

### Step 6: Implement LocalStorage for Last Used Backlog

**Tasks:**
1. Create helper functions: `getLastUsedBacklog()`, `setLastUsedBacklog(id)`
2. Load last used backlog on modal open and set as default value
3. Save selected backlog to localStorage on successful submission
4. Handle edge case: last used backlog no longer exists (fallback to first)

**Acceptance Criteria:**
- Last used backlog remembered across sessions
- Fallback to first backlog if last used no longer exists

---

### Step 7: Add Form Validation (Zod Schema)

**Tasks:**
1. Define zod schema in `DumpModeForm.tsx`
2. Validate max 10 lines with custom refine function
3. Validate min 1 line (required)
4. Validate each line ≤500 characters
5. Validate targetListId is a valid UUID
6. Connect schema to react-hook-form via `zodResolver`
7. Display error messages below Textarea and BacklogSelector

**Acceptance Criteria:**
- Form submission blocked if validation fails
- Error messages displayed inline
- Errors clear when user corrects input

---

### Step 8: Create Submit and Cancel Buttons

**Tasks:**
1. Add `DialogFooter` to modal with two buttons
2. Create Submit button with label: "Add to [Backlog Name]"
3. Make Submit button disabled if form invalid or loading
4. Add loading spinner to Submit button during API call
5. Create Cancel button with label: "Cancel"
6. Connect Cancel button to `onOpenChange(false)`

**Acceptance Criteria:**
- Submit button disabled when form invalid
- Submit button shows loading state during submission
- Cancel button closes modal without submitting

---

### Step 9: Implement API Integration (Bulk Add Mutation)

**Tasks:**
1. Create `useBulkAddTasksMutation` custom hook in `apps/frontend/src/hooks/api/`
2. Use TanStack Query's `useMutation` hook
3. Implement mutation function to POST to `/v1/tasks/bulk-add`
4. Parse form data: split textarea by lines, filter blanks, build request object
5. Handle `onSuccess`: invalidate tasks and lists queries, close modal, save last used backlog
6. Handle `onError`: display error message, keep modal open

**Acceptance Criteria:**
- Mutation successfully creates tasks via API
- TanStack Query cache invalidated on success
- Error messages displayed on failure

---

### Step 10: Add Keyboard Shortcuts (Enter to Submit, Esc to Cancel)

**Tasks:**
1. Add `onKeyDown` handler to form or modal
2. Detect `Cmd+Enter` or `Enter` (if not in textarea) to submit
3. Detect `Esc` to cancel and close modal
4. Prevent default browser behavior for these keys

**Acceptance Criteria:**
- `Cmd+Enter` submits form (if valid)
- `Esc` closes modal
- Shortcuts work from any focused element within modal

---

### Step 11: Implement Focus Trap

**Tasks:**
1. Use shadcn/ui Dialog's built-in focus trap (should be automatic)
2. Test Tab navigation within modal (cycles between elements)
3. Ensure Tab doesn't escape modal to background content
4. Verify first focusable element (Textarea) focused on open

**Acceptance Criteria:**
- Tab cycles within modal (Textarea → Dropdown → Cancel → Submit → Textarea)
- Focus doesn't escape to background
- Textarea autofocused on open

---

### Step 12: Add Success Feedback (Optional)

**Tasks:**
1. Display success message or toast on successful submission (optional for MVP)
2. Message: "X tasks added to [Backlog Name]"
3. Auto-dismiss after 3 seconds
4. Consider using shadcn/ui Toast component or inline message

**Acceptance Criteria:**
- Success message visible briefly after submission
- Message dismisses automatically or on user action

---

### Step 13: Test Edge Cases and Error Scenarios

**Tasks:**
1. Test with 0 lines (should disable submit)
2. Test with exactly 10 lines (should enable submit)
3. Test with >10 lines (should disable submit and show error)
4. Test with lines >500 characters (should show error)
5. Test with all blank lines (should disable submit)
6. Test with mix of blank and non-blank lines (should count only non-blank)
7. Test with no backlogs available (should prevent modal open or show error)
8. Test network error during submission (should show error)
9. Test successful submission (should close modal and add tasks)

**Acceptance Criteria:**
- All edge cases handled gracefully
- Error messages clear and actionable
- No crashes or unexpected behavior

---

### Step 14: Accessibility Testing

**Tasks:**
1. Test with keyboard navigation only (no mouse)
2. Test with screen reader (VoiceOver, NVDA, or JAWS)
3. Verify modal title announced on open
4. Verify error messages announced to screen reader
5. Verify focus management (autofocus, focus trap, focus return on close)
6. Ensure all interactive elements reachable via Tab
7. Test color contrast for line counter (green, yellow, red)

**Acceptance Criteria:**
- Modal fully accessible via keyboard
- Screen reader announces all relevant information
- WCAG AA compliance met

---

### Step 15: Mobile Responsiveness (Optional for MVP)

**Tasks:**
1. Test modal on mobile viewport (320px - 768px)
2. Adjust modal width and padding for mobile
3. Consider bottom sheet modal pattern for mobile (optional)
4. Test touch interactions (tap to select backlog, tap to submit)

**Acceptance Criteria:**
- Modal usable on mobile devices
- No layout issues on small screens
- Touch targets meet minimum size (44x44px)

---

### Step 16: Code Review and Cleanup

**Tasks:**
1. Review code for consistency with project standards
2. Remove console.logs and debug code
3. Add comments for complex logic
4. Extract repeated logic into helper functions
5. Ensure TypeScript strict mode compliance
6. Run linter and fix issues
7. Run tests and ensure all pass

**Acceptance Criteria:**
- Code follows project conventions
- No linting errors
- All tests pass
- TypeScript strict mode satisfied

---

### Step 17: Integration Testing

**Tasks:**
1. Test modal integration with Plan Mode
2. Test modal integration with Work Mode
3. Test modal integration with Done Archive
4. Verify tasks appear in selected backlog after submission
5. Verify TanStack Query cache updates correctly
6. Test multiple submissions in same session
7. Test modal after browser refresh (localStorage persistence)

**Acceptance Criteria:**
- Modal works from all authenticated views
- Tasks created successfully appear in correct backlog
- Cache updates reflect new tasks immediately
- Last used backlog persists across sessions

---

### Step 18: Documentation

**Tasks:**
1. Add component documentation (JSDoc if needed)
2. Update keyboard shortcuts documentation (if applicable)
3. Document edge cases and limitations
4. Add usage examples in component comments

**Acceptance Criteria:**
- Components documented for future developers
- Keyboard shortcuts listed in help overlay

---

## Summary

This implementation plan provides a comprehensive blueprint for building the Dump Mode Modal. The modal enables quick multi-line task creation with keyboard-first interaction, real-time validation, and seamless integration with the existing GSD application.

**Key Features Delivered:**
- Global keyboard shortcut (`Cmd+Shift+D`) access
- Multi-line textarea with max 10 lines validation
- Real-time line counter with color coding
- Backlog selector with last-used memory
- Form validation with Zod and react-hook-form
- TanStack Query mutation for API integration
- Focus trap and keyboard navigation
- Accessibility compliance (WCAG AA)
- Error handling for edge cases

**Implementation Phases:**
1. Phase 1 (Steps 1-4): Modal shell, keyboard shortcut, form basics, line counter
2. Phase 2 (Steps 5-7): Backlog selector, localStorage, validation
3. Phase 3 (Steps 8-12): Buttons, API integration, keyboard shortcuts, focus trap, success feedback
4. Phase 4 (Steps 13-18): Testing, accessibility, mobile, cleanup, integration, documentation

The modal is designed to be non-blocking, allowing users to quickly capture tasks and return to their workflow with minimal disruption. All requirements from the PRD and UI plan are addressed, ensuring a seamless user experience.
