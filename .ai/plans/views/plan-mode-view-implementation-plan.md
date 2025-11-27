# View Implementation Plan: Plan Mode

## 1. Overview

Plan Mode is the primary task and list management interface for GSD. It provides comprehensive CRUD operations for both lists and tasks with keyboard-first navigation. The view displays backlogs in a fixed left column (280px) and intermediate lists in a horizontally scrollable area, enabling users to organize tasks across multiple lists in a left-to-right workflow (backlogs → intermediate lists → Done).

Key features include:
- Keyboard-first navigation using arrow keys (primary) and vim-style h/j/k/l (alternates)
- Spreadsheet-like cell selection for tasks and lists
- Inline editing for tasks and list names
- Visual limit indicators (10 lists max, 100 tasks per list max)
- Optimistic updates for smooth UX
- Mobile-responsive with swipeable single-column layout

## 2. View Routing

**Path:** `/app/plan`

**Route Type:** React SPA route within authenticated app shell

**Access Control:** Requires valid JWT cookie (authenticated users only)

**Default View:** Yes (redirects from `/app` to `/app/plan` by default)

## 3. Component Structure

```
<PlanModeLayout>
  └── <AppHeader currentMode="plan" />
  └── <KeyboardNavigationProvider>
      └── <BoardLayout>
          ├── <BacklogColumn>
          │   ├── <ListColumn> (for each backlog)
          │   │   ├── <ListHeader>
          │   │   │   ├── <EditableListName />
          │   │   │   ├── <ListLimitIndicator />
          │   │   │   └── <ListActionsMenu />
          │   │   └── <TaskListContainer>
          │   │       ├── <InlineTaskCreator /> (conditional)
          │   │       ├── <TaskRow> (for each task)
          │   │       │   ├── <TaskColorIndicator />
          │   │       │   ├── <TaskContent />
          │   │       │   └── <TaskActionsMenu />
          │   │       └── <EmptyListState /> (conditional)
          │   └── <CreateListButton type="backlog" />
          │
          └── <IntermediateListsContainer>
              ├── <ListColumn> (for each intermediate list)
              │   └── [same structure as backlog ListColumn]
              └── <CreateListButton type="intermediate" />
```

## 4. Component Details

### PlanModeLayout

**Component Description:**
Top-level container for Plan Mode view. Provides the outer layout structure and integrates the AppHeader with the board content area.

**Main Elements:**
- `<div>` with full viewport height layout
- `<AppHeader>` component at top
- `<main>` element wrapping the board area
- Keyboard event listener attached at this level

**Handled Events:**
- None directly (delegates to child components)

**Validation:**
- None

**Types:**
- None specific (layout component)

**Props:**
```typescript
interface PlanModeLayoutProps {
  children?: React.ReactNode;
}
```

---

### BoardLayout

**Component Description:**
Main board container implementing the two-column layout pattern: fixed-width backlog column on left, horizontally scrollable intermediate lists on right. Manages keyboard navigation context and coordinate selection state.

**Main Elements:**
- `<div>` with flex layout (`flex flex-row`)
- `<BacklogColumn>` fixed at 280px width
- `<IntermediateListsContainer>` with flex-1 and horizontal scroll
- Global keyboard event handler

**Handled Events:**
- Global keydown events (arrow keys, vim keys, action keys)
- Focus management
- Selection state updates

**Validation:**
- Validates keyboard shortcuts don't trigger when input/textarea focused
- Prevents actions when limits reached

**Types:**
- `BoardState` (see Types section)
- `KeyboardNavigationState` (see Types section)
- `ListDto[]`, `TaskDto[]`

**Props:**
```typescript
interface BoardLayoutProps {
  lists: ListDto[];
  tasks: TaskDto[];
  isLoading: boolean;
  error: Error | null;
}
```

---

### BacklogColumn

**Component Description:**
Fixed-width left column displaying all backlog lists vertically stacked. Provides visual separation from intermediate lists and hosts backlog-specific creation controls.

**Main Elements:**
- `<aside>` with fixed width (280px desktop, full width mobile)
- Background color distinct from intermediate lists
- Vertically scrollable container
- `<div>` for each backlog ListColumn
- `<CreateListButton>` at bottom

**Handled Events:**
- Vertical scroll within column
- List selection

**Validation:**
- At least one backlog must exist (disable delete on last backlog)

**Types:**
- `ListDto[]` (filtered to isBacklog=true)
- `TaskDto[][]` (tasks grouped by list)

**Props:**
```typescript
interface BacklogColumnProps {
  backlogs: ListWithTasks[];
  selectedListId: string | null;
  selectedTaskId: string | null;
  onListSelect: (listId: string) => void;
  onTaskSelect: (taskId: string) => void;
  canCreateList: boolean;
}
```

---

### IntermediateListsContainer

**Component Description:**
Horizontally scrollable container for intermediate (non-backlog, non-Done) lists. Implements smooth scrolling and visual scroll indicators.

**Main Elements:**
- `<section>` with `overflow-x-auto` and `scroll-snap-x`
- Flex row layout
- `<ListColumn>` for each intermediate list (280px each)
- `<CreateListButton>` at right end
- Scroll position indicators (optional dots)

**Handled Events:**
- Horizontal scroll (mouse wheel, trackpad, keyboard)
- Scroll into view on keyboard navigation
- Touch swipe on mobile

**Validation:**
- Total non-Done lists (backlogs + intermediate) must not exceed 10

**Types:**
- `ListDto[]` (filtered to isBacklog=false, isDone=false)
- `TaskDto[][]`

**Props:**
```typescript
interface IntermediateListsContainerProps {
  intermediateLists: ListWithTasks[];
  selectedListId: string | null;
  selectedTaskId: string | null;
  onListSelect: (listId: string) => void;
  onTaskSelect: (taskId: string) => void;
  canCreateList: boolean;
}
```

---

### ListColumn

**Component Description:**
Individual list container displaying list header and task list. Represents a single backlog or intermediate list with all its tasks. Fixed width (280px) with vertical scrolling for tasks.

**Main Elements:**
- `<div>` container with fixed width
- `<ListHeader>` at top
- `<TaskListContainer>` for tasks (scrollable)
- Selection ring when list is focused
- Border styling (left border for backlogs with color)

**Handled Events:**
- Click to select list
- Keyboard navigation within list

**Validation:**
- Task count must not exceed 100

**Types:**
- `ListWithTasks` (see Types section)
- `KeyboardNavigationState`

**Props:**
```typescript
interface ListColumnProps {
  list: ListDto;
  tasks: TaskDto[];
  isSelected: boolean;
  hasTaskSelected: boolean;
  selectedTaskId: string | null;
  taskCount: number;
  canCreateTask: boolean;
  canDelete: boolean;
  canToggleBacklog: boolean;
  onSelect: () => void;
  onTaskSelect: (taskId: string) => void;
}
```

---

### ListHeader

**Component Description:**
List title bar with editable name, task count indicator, and actions menu. Displays list metadata and provides access to list operations.

**Main Elements:**
- `<header>` element with flex layout
- `<EditableListName>` component (or plain text when not editing)
- `<ListLimitIndicator>` badge showing task count
- `<ListActionsMenu>` dropdown button (three dots icon)

**Handled Events:**
- Click on name to edit
- 'e' key to edit (when list selected)
- Actions menu open/close

**Validation:**
- List name: min 1, max 100 characters
- Cannot delete if last non-Done list
- Cannot toggle backlog if last backlog

**Types:**
- `ListDto`
- `UpdateListRequest`

**Props:**
```typescript
interface ListHeaderProps {
  list: ListDto;
  taskCount: number;
  maxTasks: number;
  isSelected: boolean;
  canDelete: boolean;
  canToggleBacklog: boolean;
  onRename: (newName: string) => Promise<void>;
  onDelete: (destListId: string) => Promise<void>;
  onToggleBacklog: () => Promise<void>;
}
```

---

### EditableListName

**Component Description:**
Inline editable list name field. Switches between display and edit modes, supporting both click and keyboard triggers.

**Main Elements:**
- `<h3>` or `<button>` when in display mode
- `<input type="text">` when in edit mode
- Form wrapper with validation

**Handled Events:**
- Click to enter edit mode
- Enter to save
- Escape to cancel
- Blur to save (optional)

**Validation:**
- Name required (min 1 character)
- Max 100 characters
- Trim whitespace

**Types:**
- `string` (list name)

**Props:**
```typescript
interface EditableListNameProps {
  name: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (newName: string) => Promise<void>;
  onCancel: () => void;
}
```

---

### ListLimitIndicator

**Component Description:**
Visual badge showing task count with color coding based on limit proximity. Provides at-a-glance awareness of list capacity.

**Main Elements:**
- `<span>` badge with background color
- Text: "{count}/{max}"
- Color coding:
  - Green/neutral: 0-79 tasks
  - Yellow/warning: 80-99 tasks
  - Red/critical: 100 tasks

**Handled Events:**
- Hover to show tooltip (optional)

**Validation:**
- None (display only)

**Types:**
- `number` (count, max)

**Props:**
```typescript
interface ListLimitIndicatorProps {
  count: number;
  max: number;
  showWarning?: boolean; // true when count >= 80
  showError?: boolean;   // true when count >= 100
}
```

---

### ListActionsMenu

**Component Description:**
Dropdown menu providing list operations: rename, delete, toggle backlog status, reorder. Uses shadcn/ui DropdownMenu component.

**Main Elements:**
- `<DropdownMenu>` from shadcn/ui
- Trigger button (three dots icon)
- Menu items:
  - Rename list
  - Delete list (with disabled state)
  - Toggle backlog (mark/unmark)
  - Move left/right (if applicable)

**Handled Events:**
- Menu item clicks
- Keyboard navigation within menu

**Validation:**
- Delete disabled if last non-Done list
- Unmark backlog disabled if last backlog
- Reorder disabled at edges

**Types:**
- `ListDto`
- `ListAction` type

**Props:**
```typescript
interface ListActionsMenuProps {
  list: ListDto;
  canDelete: boolean;
  canToggleBacklog: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onRename: () => void;
  onDelete: () => void;
  onToggleBacklog: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}
```

---

### TaskListContainer

**Component Description:**
Scrollable container for tasks within a list. Manages task rendering, empty states, and inline task creation.

**Main Elements:**
- `<ul>` with vertical scroll (`overflow-y-auto`)
- `<InlineTaskCreator>` at top (when creating)
- `<TaskRow>` for each task (as `<li>`)
- `<EmptyListState>` when no tasks
- Max height based on available viewport

**Handled Events:**
- Vertical scroll
- Task selection via keyboard/mouse

**Validation:**
- Task count <= 100

**Types:**
- `TaskDto[]`
- `string | null` (selectedTaskId)

**Props:**
```typescript
interface TaskListContainerProps {
  listId: string;
  tasks: TaskDto[];
  selectedTaskId: string | null;
  isCreating: boolean;
  canCreateTask: boolean;
  onTaskSelect: (taskId: string) => void;
  onCreateStart: () => void;
  onCreateCancel: () => void;
  onCreateSubmit: (data: CreateTaskFormData) => Promise<void>;
}
```

---

### TaskRow

**Component Description:**
Individual task display with title, optional description preview, origin color indicator, and action menu. Supports selection highlighting and hover states.

**Main Elements:**
- `<li>` element
- `<TaskColorIndicator>` (4px left border in origin color)
- `<div>` for task content:
  - Title (bold)
  - Description preview (truncated, gray)
- `<TaskActionsMenu>` (on hover or when selected)
- Selection ring when focused

**Handled Events:**
- Click to select
- Double-click to edit (optional)
- Hover to show actions
- Keyboard shortcuts when selected:
  - 'e' or Enter: edit
  - Delete: delete
  - 'm': move
  - Space: complete
  - Cmd+Up/Down: reorder

**Validation:**
- None (display component)

**Types:**
- `TaskDto`
- `boolean` (isSelected)

**Props:**
```typescript
interface TaskRowProps {
  task: TaskDto;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (targetListId: string) => void;
  onComplete: () => void;
  onReorder: (direction: 'up' | 'down') => void;
}
```

---

### TaskEditForm

**Component Description:**
Inline task editing form replacing TaskRow when editing. Provides title and description inputs with validation.

**Main Elements:**
- `<form>` with react-hook-form
- `<input type="text">` for title (autofocused)
- `<textarea>` for description
- Validation error messages
- Save/Cancel buttons (or Enter/Esc keys)

**Handled Events:**
- Form submit (Enter key or Save button)
- Cancel (Escape key or Cancel button)
- Input changes with validation

**Validation:**
- Title: required, min 1, max 500 characters
- Description: optional, max 5000 characters
- Zod schema validation

**Types:**
- `TaskDto` (existing task)
- `UpdateTaskRequest`
- `CreateTaskFormData` (for validation)

**Props:**
```typescript
interface TaskEditFormProps {
  task: TaskDto;
  onSave: (data: UpdateTaskRequest) => Promise<void>;
  onCancel: () => void;
}
```

---

### InlineTaskCreator

**Component Description:**
Quick task creation form appearing at the top of a list when 'n' key is pressed. Minimal form for fast task capture.

**Main Elements:**
- `<form>` with react-hook-form
- `<input type="text">` for title (autofocused)
- `<textarea>` for description (optional, expandable)
- Positioned at top of TaskListContainer

**Handled Events:**
- Form submit (Enter key)
- Cancel (Escape key)
- Input validation

**Validation:**
- Title: required, min 1, max 500 characters
- Description: optional, max 5000 characters
- List must have < 100 tasks

**Types:**
- `CreateTaskRequest`
- `CreateTaskFormData`

**Props:**
```typescript
interface InlineTaskCreatorProps {
  listId: string;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  onCancel: () => void;
}
```

---

### TaskActionsMenu

**Component Description:**
Compact menu for task operations, appearing on hover or when task is selected. Provides edit, delete, move, complete actions.

**Main Elements:**
- `<DropdownMenu>` from shadcn/ui (or button group)
- Menu items:
  - Edit task
  - Delete task
  - Move to... (opens list selector)
  - Complete task
  - Move up/down (if applicable)

**Handled Events:**
- Menu item clicks
- Keyboard shortcuts (delegated from parent)

**Validation:**
- Move disabled if no other lists available
- Move disabled if destination list at 100 tasks

**Types:**
- `TaskDto`
- `TaskAction` type

**Props:**
```typescript
interface TaskActionsMenuProps {
  task: TaskDto;
  canMoveUp: boolean;
  canMoveDown: boolean;
  availableDestinationLists: ListDto[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (targetListId: string) => void;
  onComplete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}
```

---

### TaskColorIndicator

**Component Description:**
Visual indicator showing task's origin backlog color as a 4px left border. Helps users visually trace task origin.

**Main Elements:**
- `<div>` with `border-l-4` in dynamic color
- Absolute or relative positioned within TaskRow

**Handled Events:**
- None (visual only)

**Validation:**
- None

**Types:**
- `string` (hex color)

**Props:**
```typescript
interface TaskColorIndicatorProps {
  color: string; // hex color from task.color
}
```

---

### EmptyListState

**Component Description:**
Placeholder displayed when a list has no tasks. Provides guidance and quick action to create first task.

**Main Elements:**
- `<div>` centered in TaskListContainer
- Icon (empty box or similar)
- Text: "No tasks yet"
- Optional: "Press 'n' to create a task" hint
- Create task button (optional)

**Handled Events:**
- Click to create task (triggers InlineTaskCreator)

**Validation:**
- None

**Types:**
- None

**Props:**
```typescript
interface EmptyListStateProps {
  listId: string;
  canCreateTask: boolean;
  onCreateClick: () => void;
}
```

---

### CreateListButton

**Component Description:**
Button to create a new list (backlog or intermediate). Disabled when 10-list limit reached. Positioned at bottom of backlog column or right end of intermediate lists.

**Main Elements:**
- `<button>` with icon (plus sign)
- Text: "Create List" or "New Backlog"
- Disabled state with tooltip when limit reached

**Handled Events:**
- Click to open create list modal/form
- Keyboard shortcut 'l'

**Validation:**
- Disabled when totalNonDoneLists >= 10
- Tooltip: "Maximum 10 lists reached"

**Types:**
- `CreateListRequest`

**Props:**
```typescript
interface CreateListButtonProps {
  type: 'backlog' | 'intermediate';
  canCreate: boolean;
  onCreate: (data: CreateListFormData) => Promise<void>;
}
```

---

### KeyboardNavigationProvider

**Component Description:**
React Context provider managing keyboard navigation state across the entire board. Handles selection, focus mode, and keyboard event routing.

**Main Elements:**
- React Context Provider
- Global keyboard event listener
- State management for selectedListId, selectedTaskId, focusMode
- SessionStorage persistence

**Handled Events:**
- All keyboard events (arrow keys, vim keys, action keys)
- Focus management
- Mode switching (list vs task focus)

**Validation:**
- Validates navigation doesn't cross boundaries
- Prevents actions when modal open

**Types:**
- `KeyboardNavigationState` (see Types section)

**Context Value:**
```typescript
interface KeyboardNavigationContextValue {
  selectedListId: string | null;
  selectedTaskId: string | null;
  focusMode: 'list' | 'task';
  isCreating: boolean;
  creatingInListId: string | null;
  isEditing: boolean;
  editingTaskId: string | null;
  selectList: (listId: string) => void;
  selectTask: (taskId: string) => void;
  setFocusMode: (mode: 'list' | 'task') => void;
  moveSelection: (direction: 'up' | 'down' | 'left' | 'right') => void;
  clearSelection: () => void;
  startCreating: (listId: string) => void;
  stopCreating: () => void;
  startEditing: (taskId: string) => void;
  stopEditing: () => void;
}
```

---

## 5. Types

### Existing DTOs (from @gsd/types)

These types are already defined in `packages/types/src/api/*.ts` and will be imported:

**ListDto:**
```typescript
{
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

**TaskDto:**
```typescript
{
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

**CreateListRequest:**
```typescript
{
  name: string;
  isBacklog?: boolean;
  color?: string;
}
```

**UpdateListRequest:**
```typescript
{
  name: string;
}
```

**ReorderListRequest:**
```typescript
{
  newOrderIndex?: number;
  afterListId?: string;
}
```

**CreateTaskRequest:**
```typescript
{
  title: string;
  description?: string;
  listId: string;
}
```

**UpdateTaskRequest:**
```typescript
{
  title?: string;
  description?: string | null;
}
```

**MoveTaskRequest:**
```typescript
{
  listId: string;
}
```

**ReorderTaskRequest:**
```typescript
{
  newOrderIndex?: number;
  afterTaskId?: string;
}
```

**GetListsResponseDto:**
```typescript
{
  lists: ListDto[];
}
```

**GetTasksResponseDto:**
```typescript
{
  tasks: TaskDto[];
  total: number;
  limit: number;
  offset: number;
}
```

### New ViewModel Types

These types will be created in the Plan Mode view implementation:

**ListWithTasks:**
Extended list data including tasks and computed properties
```typescript
interface ListWithTasks {
  list: ListDto;                  // Base list data
  tasks: TaskDto[];               // Tasks belonging to this list
  taskCount: number;              // tasks.length
  isAtLimit: boolean;             // taskCount >= 100
  isNearLimit: boolean;           // taskCount >= 80
  canCreateTask: boolean;         // !isAtLimit
  canDelete: boolean;             // Based on total list count and backlog rules
  canToggleBacklog: boolean;      // Based on backlog count if unmarking
}
```

**BoardState:**
Computed state for the entire board layout
```typescript
interface BoardState {
  backlogs: ListWithTasks[];          // Lists where isBacklog=true
  intermediateLists: ListWithTasks[]; // Lists where isBacklog=false, isDone=false
  totalNonDoneLists: number;          // backlogs.length + intermediateLists.length
  canCreateList: boolean;             // totalNonDoneLists < 10
  activeWorkListId: string;           // ID of rightmost non-Done list
  hasOnlyBacklogs: boolean;           // intermediateLists.length === 0
  backlogCount: number;               // backlogs.length
}
```

**KeyboardNavigationState:**
State for keyboard navigation and selection
```typescript
interface KeyboardNavigationState {
  selectedListId: string | null;   // Currently focused list
  selectedTaskId: string | null;   // Currently focused task within selected list
  focusMode: 'list' | 'task';      // Whether focus is on list header or task
  isCreating: boolean;             // Whether inline task creator is active
  creatingInListId: string | null; // Which list is showing creator
  isEditing: boolean;              // Whether task edit form is active
  editingTaskId: string | null;    // Which task is being edited
}
```

**CreateTaskFormData:**
Form data for task creation
```typescript
interface CreateTaskFormData {
  title: string;
  description?: string;
}
```

**CreateListFormData:**
Form data for list creation
```typescript
interface CreateListFormData {
  name: string;
  isBacklog: boolean;
}
```

**TaskAction:**
Union type for task operations
```typescript
type TaskAction =
  | { type: 'edit'; taskId: string }
  | { type: 'delete'; taskId: string }
  | { type: 'move'; taskId: string; targetListId: string }
  | { type: 'complete'; taskId: string }
  | { type: 'reorder'; taskId: string; direction: 'up' | 'down' };
```

**ListAction:**
Union type for list operations
```typescript
type ListAction =
  | { type: 'rename'; listId: string; newName: string }
  | { type: 'delete'; listId: string; destListId: string }
  | { type: 'toggleBacklog'; listId: string }
  | { type: 'reorder'; listId: string; direction: 'left' | 'right' };
```

**ErrorState:**
Error information for UI display
```typescript
interface ErrorState {
  type: 'task' | 'list' | 'general';
  id?: string;              // Task or list ID if applicable
  message: string;
  timestamp: number;
}
```

## 6. State Management

Plan Mode uses a multi-layered state management approach combining TanStack Query for server state, React Context for keyboard navigation, and local component state for UI interactions.

### Server State (TanStack Query)

All server data is managed through TanStack Query with custom hooks:

**Data Fetching Hooks:**

1. **usePlanModeData()**
   - Fetches lists and tasks in parallel on mount
   - Returns: `{ lists: ListDto[], tasks: TaskDto[], isLoading, error }`
   - Uses: `GET /v1/lists` and `GET /v1/tasks`
   - Cache key: `['lists']` and `['tasks']`
   - Refetch on window focus

2. **useListsQuery()**
   - Fetches all user's lists
   - Returns: `{ data: GetListsResponseDto, isLoading, error, refetch }`
   - Uses: `GET /v1/lists`
   - Cache key: `['lists']`

3. **useTasksQuery(listId?: string)**
   - Fetches tasks, optionally filtered by list
   - Returns: `{ data: GetTasksResponseDto, isLoading, error, refetch }`
   - Uses: `GET /v1/tasks?listId={listId}`
   - Cache key: `['tasks', listId]` or `['tasks']`

**Mutation Hooks (Lists):**

1. **useCreateListMutation()**
   - Creates new list
   - Input: `CreateListRequest`
   - Output: `ListDto`
   - On success: Invalidates `['lists']` query
   - Uses: `POST /v1/lists`

2. **useUpdateListMutation()**
   - Updates list name
   - Input: `{ listId: string, data: UpdateListRequest }`
   - Output: `ListDto`
   - Optimistic update: Updates cache immediately
   - On error: Rolls back to previous state
   - Uses: `PATCH /v1/lists/{id}`

3. **useDeleteListMutation()**
   - Deletes list and moves tasks to destination
   - Input: `{ listId: string, destListId: string }`
   - Output: `void`
   - On success: Invalidates `['lists']` and `['tasks']` queries
   - Uses: `DELETE /v1/lists/{id}?destListId={destListId}`

4. **useToggleBacklogMutation()**
   - Toggles list backlog status
   - Input: `{ listId: string }`
   - Output: `ListDto`
   - Optimistic update: Updates isBacklog in cache
   - On error: Rolls back
   - Uses: `POST /v1/lists/{id}/toggle-backlog`

5. **useReorderListMutation()**
   - Reorders list position
   - Input: `{ listId: string, data: ReorderListRequest }`
   - Output: `ListDto`
   - Optimistic update: Reorders lists in cache
   - On error: Rolls back
   - Uses: `POST /v1/lists/{id}/reorder`

**Mutation Hooks (Tasks):**

1. **useCreateTaskMutation()**
   - Creates new task at top of list
   - Input: `CreateTaskRequest`
   - Output: `TaskDto`
   - On success: Invalidates `['tasks', listId]` query
   - Uses: `POST /v1/tasks`

2. **useUpdateTaskMutation()**
   - Updates task title/description
   - Input: `{ taskId: string, data: UpdateTaskRequest }`
   - Output: `TaskDto`
   - Optimistic update: Updates task in cache
   - On error: Rolls back
   - Uses: `PATCH /v1/tasks/{id}`

3. **useDeleteTaskMutation()**
   - Deletes task
   - Input: `{ taskId: string }`
   - Output: `void`
   - Optimistic update: Removes task from cache
   - On error: Rolls back
   - Uses: `DELETE /v1/tasks/{id}`

4. **useMoveTaskMutation()**
   - Moves task to different list
   - Input: `{ taskId: string, targetListId: string }`
   - Output: `TaskDto`
   - On success: Invalidates tasks queries for both lists
   - Uses: `POST /v1/tasks/{id}/move`

5. **useCompleteTaskMutation()**
   - Completes task (moves to Done)
   - Input: `{ taskId: string }`
   - Output: `TaskDto`
   - Optimistic update: Removes from current list
   - On error: Rolls back
   - Uses: `POST /v1/tasks/{id}/complete`

6. **useReorderTaskMutation()**
   - Reorders task within list
   - Input: `{ taskId: string, data: ReorderTaskRequest }`
   - Output: `TaskDto`
   - Optimistic update: Reorders tasks in cache
   - On error: Rolls back
   - Uses: `POST /v1/tasks/{id}/reorder`

### Context State (React Context)

**KeyboardNavigationProvider** manages navigation state:

- `selectedListId: string | null` - Current list focus
- `selectedTaskId: string | null` - Current task focus
- `focusMode: 'list' | 'task'` - Focus on header vs task
- `isCreating: boolean` - Inline creator active
- `creatingInListId: string | null` - Where creator is shown
- `isEditing: boolean` - Edit form active
- `editingTaskId: string | null` - Which task editing

Persisted in sessionStorage for continuity across page refreshes.

### Computed State (Custom Hooks)

**useBoardState(lists: ListDto[], tasks: TaskDto[])**
Computes derived board state:
```typescript
const boardState: BoardState = {
  backlogs: [...],              // Filtered and enriched
  intermediateLists: [...],     // Filtered and enriched
  totalNonDoneLists: number,
  canCreateList: boolean,
  activeWorkListId: string,
  hasOnlyBacklogs: boolean,
  backlogCount: number
};
```

**useLimitValidation(boardState: BoardState)**
Provides limit checking:
```typescript
const {
  canCreateList,
  canCreateTaskInList(listId),
  canDeleteList(listId),
  canToggleBacklog(listId),
  getListLimitStatus(listId)
} = useLimitValidation(boardState);
```

### Local Component State

Individual components manage ephemeral UI state:
- Form inputs (controlled components)
- Menu open/close states
- Hover states
- Loading indicators for individual operations

### State Flow Example: Creating a Task

1. User presses 'n' on selected list
2. KeyboardNavigationProvider sets `isCreating=true`, `creatingInListId=listId`
3. InlineTaskCreator renders and auto-focuses title input
4. User types title, optional description
5. User presses Enter
6. Form validates using zod schema
7. useCreateTaskMutation executes:
   - POST /v1/tasks { title, description, listId }
8. On success:
   - Invalidates `['tasks', listId]` query
   - TanStack Query refetches tasks
9. KeyboardNavigationProvider sets `isCreating=false`
10. New task appears at top, gets selected
11. InlineTaskCreator unmounts

### State Flow Example: Optimistic Task Reorder

1. User selects task, presses Cmd+Up
2. useReorderTaskMutation calculates afterTaskId
3. onMutate callback:
   - Cancels in-flight queries
   - Snapshots current tasks cache
   - Updates cache optimistically (reorder visually)
4. POST /v1/tasks/{id}/reorder { afterTaskId }
5. On success:
   - Server returns updated task
   - Cache already reflects change (no flash)
6. On error:
   - onError callback restores snapshot
   - User sees rollback
   - Error message displayed

## 7. API Integration

Plan Mode integrates with multiple REST endpoints for lists and tasks.

### Lists API Integration

**Fetch all lists:**
- **Endpoint:** `GET /v1/lists`
- **Request:** None (authenticated via cookie)
- **Response:** `GetListsResponseDto { lists: ListDto[] }`
- **Usage:** On mount, after mutations
- **Hook:** `useListsQuery()`

**Create list:**
- **Endpoint:** `POST /v1/lists`
- **Request:** `CreateListRequest { name, isBacklog?, color? }`
- **Response:** `ListDto`
- **Validation:** name min 1 max 100, total lists < 10
- **Error 400:** "Maximum 10 non-Done lists reached"
- **Hook:** `useCreateListMutation()`

**Update list:**
- **Endpoint:** `PATCH /v1/lists/{id}`
- **Request:** `UpdateListRequest { name }`
- **Response:** `ListDto`
- **Validation:** name min 1 max 100
- **Hook:** `useUpdateListMutation()`

**Delete list:**
- **Endpoint:** `DELETE /v1/lists/{id}?destListId={destListId}`
- **Request:** Query param destListId (required)
- **Response:** 204 No Content
- **Validation:** Cannot delete last non-Done list, destListId required
- **Error 400:** Constraint violations
- **Hook:** `useDeleteListMutation()`

**Toggle backlog status:**
- **Endpoint:** `POST /v1/lists/{id}/toggle-backlog`
- **Request:** None (body empty)
- **Response:** `ListDto` with updated isBacklog
- **Validation:** Cannot unmark last backlog
- **Error 400:** "Cannot unmark last backlog"
- **Hook:** `useToggleBacklogMutation()`

**Reorder list:**
- **Endpoint:** `POST /v1/lists/{id}/reorder`
- **Request:** `ReorderListRequest { newOrderIndex?, afterListId? }`
- **Response:** `ListDto` with updated orderIndex
- **Hook:** `useReorderListMutation()`

### Tasks API Integration

**Fetch tasks:**
- **Endpoint:** `GET /v1/tasks?listId={listId}`
- **Request:** Query param listId (optional)
- **Response:** `GetTasksResponseDto { tasks: TaskDto[], total, limit, offset }`
- **Usage:** On mount, after task mutations, filtered per list
- **Hook:** `useTasksQuery(listId?)`

**Create task:**
- **Endpoint:** `POST /v1/tasks`
- **Request:** `CreateTaskRequest { title, description?, listId }`
- **Response:** `TaskDto`
- **Validation:** title min 1 max 500, description max 5000, list < 100 tasks
- **Error 400:** "List is full (100 tasks)"
- **Hook:** `useCreateTaskMutation()`

**Update task:**
- **Endpoint:** `PATCH /v1/tasks/{id}`
- **Request:** `UpdateTaskRequest { title?, description? }`
- **Response:** `TaskDto`
- **Validation:** title min 1 max 500, description max 5000
- **Hook:** `useUpdateTaskMutation()`

**Delete task:**
- **Endpoint:** `DELETE /v1/tasks/{id}`
- **Request:** None
- **Response:** 204 No Content
- **Hook:** `useDeleteTaskMutation()`

**Move task:**
- **Endpoint:** `POST /v1/tasks/{id}/move`
- **Request:** `MoveTaskRequest { listId }`
- **Response:** `TaskDto` with updated listId
- **Validation:** Destination list < 100 tasks
- **Error 400:** "Destination list is full"
- **Hook:** `useMoveTaskMutation()`

**Complete task:**
- **Endpoint:** `POST /v1/tasks/{id}/complete`
- **Request:** None
- **Response:** `TaskDto` with completedAt set, moved to Done
- **Hook:** `useCompleteTaskMutation()`

**Reorder task:**
- **Endpoint:** `POST /v1/tasks/{id}/reorder`
- **Request:** `ReorderTaskRequest { newOrderIndex?, afterTaskId? }`
- **Response:** `TaskDto` with updated orderIndex
- **Hook:** `useReorderTaskMutation()`

### Authentication

All endpoints require JWT authentication via HttpOnly cookie:
- Cookie name: `jwt`
- Set by backend after Google OAuth
- Automatic inclusion in requests (credentials: 'include')
- 401 errors trigger redirect to login

### Error Handling in API Integration

**Network Errors:**
- TanStack Query retries 3 times
- Display inline error message
- Provide retry button

**Validation Errors (400):**
- Parse error response
- Show field-specific errors
- Keep form open for correction

**Authorization Errors (401):**
- Clear auth state
- Redirect to landing page
- Invalidate all queries

**Not Found (404):**
- Refetch to get current state
- Show "Item no longer exists" message

**Server Errors (500):**
- Log to console
- Show generic error message
- Provide retry or refresh option

## 8. User Interactions

### Keyboard Navigation

**Arrow Keys (Primary):**
- `↑` / `↓` - Navigate between tasks in current list
  - Moves `selectedTaskId` up/down within task array
  - Scrolls selected task into view
  - Updates `focusMode` to 'task' if on list header
- `←` / `→` - Navigate between lists horizontally
  - Moves `selectedListId` left/right
  - Scrolls list into view (horizontal scroll)
  - Updates `focusMode` to 'list'

**Vim-Style Keys (Alternates):**
- `j` / `k` - Same as ↓ / ↑ (task navigation)
- `h` / `l` - Same as ← / → (list navigation)

**Action Keys:**
- `n` - Create new task in selected list
  - Shows InlineTaskCreator at top of list
  - Auto-focuses title input
  - Disabled if list at 100 tasks
- `e` or `Enter` - Edit selected task or list name
  - If task selected: Shows TaskEditForm
  - If list header selected: Makes list name editable
- `Delete` or `Backspace` - Delete selected task or list
  - Task: Immediately deletes (no confirmation in MVP)
  - List: Prompts for destination list
- `m` - Move selected task to different list
  - Opens list selector dropdown
  - Shows only lists with < 100 tasks
- `Space` - Complete selected task
  - Moves task to Done
  - Updates completedAt timestamp
  - Removes from current list
- `Cmd+↑` / `Cmd+↓` - Reorder task within list
  - Moves task up/down one position
  - Optimistic update
- `Cmd+←` / `Cmd+→` - Reorder list
  - Moves list left/right
  - Updates orderIndex
- `l` - Create new list
  - Opens create list form/modal
  - Disabled if 10 lists exist
- `?` - Open keyboard shortcuts help
  - Shows modal with all shortcuts

**Modifier Key Handling:**
- `Tab` - Standard browser focus (not intercepted)
- `Escape` - Cancel current operation:
  - Close inline creator
  - Close edit form
  - Close modals
  - Clear selection (optional)

### Mouse/Touch Interactions

**List Selection:**
- Click list header: Select list (set selectedListId)
- Visual feedback: ring-2 ring-offset-2

**Task Selection:**
- Click task row: Select task (set selectedTaskId)
- Double-click task: Enter edit mode (optional)
- Visual feedback: selection ring

**Hover Actions:**
- Hover over task: Show TaskActionsMenu
- Hover over list header: Show ListActionsMenu

**Inline Editing:**
- Click list name: Enter edit mode
- Click outside or Enter: Save
- Escape: Cancel

**Scrolling:**
- Vertical scroll within list: Standard scroll
- Horizontal scroll in intermediate lists: Mouse wheel + Shift or trackpad
- Scroll into view on keyboard navigation

**Mobile Touch:**
- Swipe left/right: Navigate between lists (single-column view)
- Tap task: Select and show actions
- Long press: Open context menu (optional)

### Form Interactions

**Task Creation:**
1. Press 'n' or click "Create Task"
2. InlineTaskCreator appears at top
3. Title input auto-focused
4. Type title (required)
5. Tab to description (optional)
6. Enter to submit, Escape to cancel
7. Form validates:
   - Title: 1-500 chars
   - Description: max 5000 chars
8. On success: Task appears, creator closes
9. On error: Show inline error, keep form open

**Task Editing:**
1. Select task, press 'e' or Enter
2. TaskEditForm replaces TaskRow
3. Title input focused with current value
4. Edit title/description
5. Enter to save, Escape to cancel
6. Validation same as creation
7. On success: Form closes, task updates
8. On error: Show error, keep form open

**List Creation:**
1. Press 'l' or click "Create List"
2. Modal or inline form appears
3. Name input focused
4. Type name (1-100 chars)
5. Select type: backlog or intermediate (checkbox)
6. Submit
7. On success: List appears, form closes
8. On error: Show error, keep form open

**List Deletion:**
1. Open ListActionsMenu → Delete
2. Modal prompts: "Move tasks to which list?"
3. Dropdown shows available destination lists
4. Default: first backlog
5. Confirm deletion
6. On success: List removed, tasks moved
7. On error: Show error, keep modal open

### Optimistic Update Interactions

**Task Reorder:**
- User presses Cmd+↑
- Task visually moves up immediately
- API call in background
- On error: Task snaps back, error shown

**Task Complete:**
- User presses Space
- Task fades out and disappears
- API call in background
- On error: Task reappears, error shown

**List Toggle Backlog:**
- User clicks "Mark as Backlog"
- List visually moves to backlog column
- API call in background
- On error: List moves back, error shown

### Error Recovery Interactions

**Failed Task Creation:**
- Error message below form: "Failed to create task. Retry?"
- Retry button: Resubmits same data
- Form remains open with user's input

**Failed Task Move:**
- Inline error near task: "Failed to move. Destination list may be full."
- Task remains in original list
- User can retry or move to different list

**Network Timeout:**
- Loading spinner shows for >3 seconds
- "Taking longer than expected" message
- Cancel button to abort operation

## 9. Conditions and Validation

### List Limits

**Maximum 10 Non-Done Lists:**
- **Affected Components:** CreateListButton, BoardLayout
- **Validation:** `totalNonDoneLists < 10`
- **UI State:**
  - CreateListButton disabled when limit reached
  - Tooltip: "Maximum 10 lists reached. Delete a list to create new one."
  - Keyboard shortcut 'l' no-op
- **Implementation:** useLimitValidation hook checks `boardState.canCreateList`

**At Least One Backlog:**
- **Affected Components:** ListActionsMenu (Toggle Backlog, Delete)
- **Validation:** `backlogCount >= 1`
- **UI State:**
  - "Unmark as Backlog" disabled if `backlogCount === 1`
  - Tooltip: "At least one backlog required"
  - Delete disabled if last backlog and no intermediate lists
  - If deleting last backlog with intermediates: auto-promote leftmost
- **Implementation:** useBoardState computes backlogCount, useLimitValidation checks constraint

### Task Limits

**Maximum 100 Tasks per List:**
- **Affected Components:** InlineTaskCreator, TaskActionsMenu (Move), CreateListButton behavior
- **Validation:** `list.taskCount < 100`
- **UI State:**
  - InlineTaskCreator: 'n' key disabled when list at 100
  - ListLimitIndicator:
    - Green: 0-79 tasks
    - Yellow: 80-99 tasks
    - Red: 100 tasks
  - Tooltip on disabled create: "List is full (max 100 tasks)"
  - Move menu: Destination lists at 100 shown as disabled with tooltip
- **Implementation:**
  - ListWithTasks includes `isAtLimit`, `isNearLimit`, `canCreateTask`
  - useLimitValidation provides `canCreateTaskInList(listId)`

### Form Validation

**List Name (Create/Update):**
- **Field:** name
- **Rules:**
  - Required (min 1 character)
  - Max 100 characters
  - Trimmed before submission
- **Validation Timing:** On blur, on submit
- **Error Messages:**
  - Empty: "List name is required"
  - Too long: "List name must be 100 characters or less"
- **Implementation:** Zod schema in form

**Task Title (Create/Update):**
- **Field:** title
- **Rules:**
  - Required (min 1 character)
  - Max 500 characters
  - Trimmed before submission
- **Validation Timing:** On blur, on submit
- **Error Messages:**
  - Empty: "Task title is required"
  - Too long: "Task title must be 500 characters or less"
- **Implementation:** Zod schema in react-hook-form

**Task Description (Create/Update):**
- **Field:** description
- **Rules:**
  - Optional
  - Max 5000 characters if provided
- **Validation Timing:** On blur, on submit
- **Error Messages:**
  - Too long: "Description must be 5000 characters or less"
- **Implementation:** Zod schema in react-hook-form

### Constraint Validation

**Cannot Delete Last Non-Done List:**
- **Affected Components:** ListActionsMenu
- **Validation:** `totalNonDoneLists > 1`
- **UI State:**
  - Delete option disabled
  - Tooltip: "Cannot delete the only list"
- **Implementation:** ListWithTasks.canDelete checks constraint

**Cannot Move Task to Full List:**
- **Affected Components:** TaskActionsMenu, Move List Selector
- **Validation:** `destinationList.taskCount < 100`
- **UI State:**
  - Destination lists at 100 shown as disabled
  - Tooltip: "List is full (100 tasks)"
- **Implementation:** Filter available destinations in move handler

**Destination Required for List Deletion:**
- **Affected Components:** Delete List Modal
- **Validation:** `destListId !== null && destListId !== listId`
- **UI State:**
  - Dropdown required field
  - Default to first backlog
  - Submit disabled until selected
- **Implementation:** Form validation before API call

### Keyboard Navigation Constraints

**No Navigation When Modal Open:**
- **Affected Components:** KeyboardNavigationProvider
- **Validation:** Check modal state
- **UI State:**
  - Arrow keys and action keys disabled
  - Only Escape and modal-specific keys active
- **Implementation:** Conditional keyboard handler

**No Actions When Input Focused:**
- **Affected Components:** Global keyboard listener
- **Validation:** `document.activeElement.tagName !== 'INPUT' && !== 'TEXTAREA'`
- **UI State:**
  - Action keys (n, e, m, etc.) no-op when typing
  - Arrow keys work normally in inputs
- **Implementation:** Event handler checks activeElement

## 10. Error Handling

### Network Errors

**Scenario:** API call fails due to network issue
- **Detection:** TanStack Query onError callback
- **User Feedback:**
  - Inline error message near action: "Failed to [action]. Check your connection."
  - Retry button appears
- **Behavior:**
  - Automatic retry (3 attempts with exponential backoff)
  - Rollback optimistic updates
  - Keep form open with user's data
- **Implementation:**
  ```typescript
  useCreateTaskMutation({
    onError: (error) => {
      showError('Failed to create task. Please try again.');
      rollbackOptimisticUpdate();
    }
  });
  ```

### Validation Errors (400)

**Scenario:** Server rejects request due to validation failure
- **Detection:** HTTP 400 response with error details
- **User Feedback:**
  - Parse error response for field-specific messages
  - Show errors inline below fields
  - Highlight invalid fields (red border)
- **Behavior:**
  - Keep form open
  - Allow user to correct and resubmit
  - Don't clear form data
- **Example Errors:**
  - "List name must be 100 characters or less"
  - "List is full (100 tasks)"
  - "Maximum 10 non-Done lists reached"
- **Implementation:**
  ```typescript
  if (error.statusCode === 400) {
    const message = error.message;
    setFieldError('name', message);
  }
  ```

### Limit Exceeded Errors

**Scenario:** User attempts to exceed list or task limits
- **Primary Prevention:** Disabled UI controls (buttons, keyboard shortcuts)
- **Fallback Detection:** API returns 400 with limit message
- **User Feedback:**
  - Tooltip on disabled controls explaining limit
  - If error occurs: "Limit reached. [Specific guidance]"
- **Guidance Messages:**
  - "Maximum 10 lists reached. Delete a list to create a new one."
  - "List is full (100 tasks). Delete or move tasks to add more."
- **Implementation:**
  - useLimitValidation preemptively disables controls
  - If API error, log to console (potential bug)

### Authorization Errors (401)

**Scenario:** JWT expired or invalid
- **Detection:** HTTP 401 response
- **User Feedback:**
  - Redirect to landing page
  - Optional message: "Session expired. Please sign in again."
- **Behavior:**
  - Clear all TanStack Query caches
  - Clear keyboard navigation state
  - Clear sessionStorage
  - Redirect to `/`
- **Implementation:**
  ```typescript
  if (error.statusCode === 401) {
    queryClient.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }
  ```

### Not Found Errors (404)

**Scenario:** List or task no longer exists (deleted in another session)
- **Detection:** HTTP 404 response
- **User Feedback:**
  - Message: "Item no longer exists. Refreshing..."
- **Behavior:**
  - Invalidate relevant queries
  - Refetch to get current state
  - Clear selection if item was selected
  - Update UI to reflect current data
- **Implementation:**
  ```typescript
  if (error.statusCode === 404) {
    queryClient.invalidateQueries(['lists']);
    queryClient.invalidateQueries(['tasks']);
    clearSelection();
  }
  ```

### Concurrent Modification

**Scenario:** Another session modifies the same data
- **Detection:** Optimistic update conflicts with server state
- **User Feedback:**
  - "Data changed by another session. Reloading..."
- **Behavior:**
  - Refetch affected queries
  - Rollback optimistic updates
  - Show current server state
  - Preserve user's in-progress edits if possible
- **Implementation:**
  - TanStack Query's onError checks for version conflicts
  - Refetch on conflict
  - Consider version field in future (post-MVP)

### Constraint Violations

**Scenario:** Operation violates business rules
- **Examples:**
  - Attempting to delete last backlog without intermediates
  - Attempting to unmark last backlog
- **Primary Prevention:** Disabled UI controls
- **Fallback Detection:** API returns 400 with constraint message
- **User Feedback:**
  - Inline error with explanation and guidance
  - Examples:
    - "Cannot delete last backlog. Create an intermediate list first."
    - "At least one backlog required. Mark another list as backlog first."
- **Implementation:**
  - UI checks constraints before API call
  - If API error, show specific message from response

### Orphaned Selection

**Scenario:** Selected task or list is deleted
- **Detection:** Selection ID no longer exists in data
- **User Feedback:**
  - Silent handling (no error message needed)
- **Behavior:**
  - Move selection to nearest valid item:
    - If task deleted: Select next task in list, or previous, or clear
    - If list deleted: Select next list, or previous, or clear
  - Update keyboard navigation state
- **Implementation:**
  ```typescript
  useEffect(() => {
    if (selectedTaskId && !tasks.find(t => t.id === selectedTaskId)) {
      const currentIndex = tasks.findIndex(t => t.id === selectedTaskId);
      const nextTask = tasks[currentIndex + 1] || tasks[currentIndex - 1];
      selectTask(nextTask?.id || null);
    }
  }, [tasks, selectedTaskId]);
  ```

### Stale Data

**Scenario:** Cached data out of sync with server
- **Detection:** User notices discrepancy, or window focus event
- **User Feedback:**
  - Background refetch (no UI interruption)
  - Optional: Subtle indicator "Syncing..." in header
- **Behavior:**
  - TanStack Query refetches on window focus (built-in)
  - Manual refresh available in AppHeader (future)
  - Invalidate on mutations automatically
- **Implementation:**
  ```typescript
  useQuery(['lists'], fetchLists, {
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  ```

### Error Recovery Actions

**Retry Button:**
- Appears next to error messages
- Re-executes the same operation
- Same payload as original attempt
- Disabled during retry (loading state)

**Refresh Button:**
- In AppHeader or error state
- Invalidates all queries
- Refetches from server
- Clears local errors

**Cancel Button:**
- Appears during long operations
- Aborts in-progress API call
- Restores previous state
- Closes forms/modals

## 11. Implementation Steps

### Phase 1: Setup and Core Layout (2-3 days)

1. **Create base components and routing**
   - Create `src/pages/app/plan.astro` (if using Astro routing)
   - Create `src/components/plan-mode/` directory
   - Set up React SPA route in app shell
   - Verify authentication guard works

2. **Implement PlanModeLayout and AppHeader integration**
   - Create `PlanModeLayout.tsx` with viewport height container
   - Integrate existing `AppHeader` component
   - Set `currentMode="plan"` prop
   - Test mode switcher navigation

3. **Create BoardLayout with two-column structure**
   - Create `BoardLayout.tsx` with flex layout
   - Implement fixed-width left column (280px)
   - Implement flex-1 right column with horizontal scroll
   - Add Tailwind responsive classes for mobile

4. **Set up TanStack Query**
   - Create `src/hooks/api/lists.ts` for list queries/mutations
   - Create `src/hooks/api/tasks.ts` for task queries/mutations
   - Implement `usePlanModeData()` to fetch both in parallel
   - Test data fetching on mount

### Phase 2: List Display and Management (3-4 days)

5. **Implement BacklogColumn**
   - Create `BacklogColumn.tsx` component
   - Filter lists by `isBacklog=true`
   - Implement vertical scrolling
   - Style with distinct background color

6. **Implement IntermediateListsContainer**
   - Create `IntermediateListsContainer.tsx`
   - Filter lists by `isBacklog=false, isDone=false`
   - Implement horizontal scroll with `overflow-x-auto`
   - Add CSS `scroll-snap-type: x mandatory` for smooth navigation

7. **Implement ListColumn**
   - Create `ListColumn.tsx` component
   - Accept `ListDto` and `TaskDto[]` props
   - Render ListHeader and TaskListContainer
   - Add selection ring styling

8. **Implement ListHeader**
   - Create `ListHeader.tsx` with flex layout
   - Integrate EditableListName component
   - Add ListLimitIndicator component
   - Add ListActionsMenu component

9. **Implement list CRUD operations**
   - Create `useCreateListMutation()` hook
   - Create `useUpdateListMutation()` hook with optimistic update
   - Create `useDeleteListMutation()` hook
   - Create `useToggleBacklogMutation()` hook
   - Test each operation

10. **Implement CreateListButton**
    - Create `CreateListButton.tsx`
    - Add disabled state when limit reached
    - Add tooltip for limit explanation
    - Trigger create list modal/form

### Phase 3: Task Display and Management (4-5 days)

11. **Implement TaskListContainer**
    - Create `TaskListContainer.tsx` with vertical scroll
    - Map tasks to TaskRow components
    - Add EmptyListState for zero tasks
    - Handle InlineTaskCreator conditional rendering

12. **Implement TaskRow**
    - Create `TaskRow.tsx` component
    - Add TaskColorIndicator (4px left border)
    - Display title (bold) and description preview (gray, truncated)
    - Add selection ring styling
    - Add hover state for actions menu

13. **Implement task CRUD operations**
    - Create `useCreateTaskMutation()` hook
    - Create `useUpdateTaskMutation()` hook with optimistic update
    - Create `useDeleteTaskMutation()` hook with optimistic update
    - Create `useMoveTaskMutation()` hook
    - Create `useCompleteTaskMutation()` hook with optimistic update
    - Test each operation

14. **Implement InlineTaskCreator**
    - Create `InlineTaskCreator.tsx` with react-hook-form
    - Add zod validation schema (title 1-500, description max 5000)
    - Auto-focus title input on render
    - Handle Enter to submit, Escape to cancel
    - Position at top of TaskListContainer

15. **Implement TaskEditForm**
    - Create `TaskEditForm.tsx` with react-hook-form
    - Pre-populate with existing task data
    - Same validation as InlineTaskCreator
    - Replace TaskRow when editing
    - Restore TaskRow on cancel/save

16. **Implement TaskActionsMenu**
    - Create `TaskActionsMenu.tsx` using shadcn/ui DropdownMenu
    - Add menu items: Edit, Delete, Move, Complete, Reorder
    - Show on hover or when task selected
    - Disable Move if no valid destinations
    - Handle each action with appropriate mutation

### Phase 4: Keyboard Navigation (3-4 days)

17. **Implement KeyboardNavigationProvider**
    - Create `KeyboardNavigationContext.tsx` with React Context
    - Define KeyboardNavigationState interface
    - Implement state setters (selectList, selectTask, etc.)
    - Persist state in sessionStorage
    - Restore on mount

18. **Implement keyboard event handling**
    - Add global keydown listener in BoardLayout or Provider
    - Handle arrow keys (↑↓←→) for navigation
    - Handle vim keys (hjkl) as alternates
    - Prevent default for captured keys
    - Ignore when input/textarea focused

19. **Implement action keyboard shortcuts**
    - `n` - Start creating task
    - `e` / `Enter` - Edit task/list
    - `Delete` / `Backspace` - Delete task/list
    - `m` - Move task
    - `Space` - Complete task
    - `Cmd+↑↓` - Reorder task
    - `Cmd+←→` - Reorder list
    - `l` - Create list
    - `?` - Open help (integrate with existing help modal)

20. **Implement scrollIntoView for keyboard navigation**
    - When selected task changes, scroll TaskRow into view
    - When selected list changes, scroll ListColumn into view (horizontal)
    - Use smooth scrolling behavior

21. **Implement focus management**
    - Track focusMode: 'list' | 'task'
    - Update visual focus indicators
    - Manage focus during edit mode
    - Restore focus after operations

### Phase 5: Validation and Limits (2-3 days)

22. **Implement useBoardState hook**
    - Create `hooks/useBoardState.ts`
    - Compute backlogs, intermediateLists from raw lists
    - Calculate totalNonDoneLists, canCreateList
    - Determine activeWorkListId (rightmost non-Done)
    - Count backlogCount

23. **Implement useLimitValidation hook**
    - Create `hooks/useLimitValidation.ts`
    - Implement `canCreateList` check (< 10)
    - Implement `canCreateTaskInList(listId)` check (< 100)
    - Implement `canDeleteList(listId)` check
    - Implement `canToggleBacklog(listId)` check (if last)
    - Return helper functions

24. **Implement ListLimitIndicator**
    - Create `ListLimitIndicator.tsx`
    - Display {count}/{max}
    - Color code: green (0-79), yellow (80-99), red (100)
    - Position in ListHeader

25. **Add disabled states based on limits**
    - Disable CreateListButton when totalLists >= 10
    - Disable 'n' key when list at 100 tasks
    - Disable task creation UI when at limit
    - Add tooltips explaining limits

26. **Implement "at least one backlog" constraint**
    - In useDeleteListMutation: check if last backlog
    - If last backlog and intermediates exist: auto-promote leftmost
    - If last backlog and no intermediates: block deletion
    - In useToggleBacklogMutation: block if unmarking last

### Phase 6: Optimistic Updates and Error Handling (2-3 days)

27. **Implement optimistic updates for task operations**
    - In useUpdateTaskMutation: onMutate updates cache
    - In useDeleteTaskMutation: onMutate removes from cache
    - In useCompleteTaskMutation: onMutate removes from cache
    - In useReorderTaskMutation: onMutate reorders in cache
    - All have onError to rollback using snapshot

28. **Implement optimistic updates for list operations**
    - In useUpdateListMutation: onMutate updates cache
    - In useToggleBacklogMutation: onMutate toggles isBacklog
    - In useReorderListMutation: onMutate reorders in cache
    - All have onError to rollback

29. **Implement error display components**
    - Create inline error message component
    - Position near action that failed
    - Include retry button
    - Auto-dismiss after timeout (optional)

30. **Implement error recovery**
    - Add retry logic in mutation hooks
    - Implement rollback for failed optimistic updates
    - Handle 401 (redirect to login)
    - Handle 404 (refetch and update UI)
    - Handle 400 (show validation errors)

### Phase 7: Mobile Responsiveness (2-3 days)

31. **Implement responsive layout**
    - Add Tailwind breakpoints (hidden, lg:block, etc.)
    - Test two-column layout on desktop (≥1024px)
    - Test single-column layout on mobile (<1024px)

32. **Implement mobile list navigation**
    - Create list selector dropdown in header (mobile only)
    - Show current list name
    - Allow selecting different list
    - Update view to show selected list full-width

33. **Implement swipe gestures (optional)**
    - Use react-swipeable or native touch events
    - Swipe left: next list
    - Swipe right: previous list
    - Add position indicators (dots)

34. **Optimize mobile UX**
    - Increase touch target sizes (min 44x44px)
    - Floating action button for task creation
    - Bottom sheet for actions (instead of dropdown)
    - Test on actual mobile devices

### Phase 8: Polish and Testing (2-3 days)

35. **Implement accessibility features**
    - Add ARIA labels, roles, and properties
    - Test with screen reader (VoiceOver, NVDA)
    - Ensure all interactive elements keyboard accessible
    - Add focus-visible styles
    - Test high-contrast mode

36. **Implement loading states**
    - Show skeleton loaders during initial fetch
    - Show spinners on mutations
    - Disable actions during loading
    - Avoid layout shifts

37. **Implement empty states**
    - EmptyListState when list has no tasks
    - Empty board state when no lists (first-time user)
    - Provide clear next actions

38. **Performance optimization**
    - Add React.memo to TaskRow
    - Virtualize if needed (react-window)
    - Optimize re-renders with proper key props
    - Test with max data (10 lists × 100 tasks)

39. **Manual testing**
    - Test all keyboard shortcuts
    - Test all CRUD operations
    - Test limit enforcement
    - Test error scenarios (network off, invalid data)
    - Test on different browsers
    - Test on mobile devices

40. **Integration testing (optional)**
    - Write tests for critical user flows
    - Test keyboard navigation
    - Test limit validation
    - Test optimistic updates and rollback

### Phase 9: Documentation and Handoff (1 day)

41. **Document keyboard shortcuts**
    - Ensure help modal (?) lists all shortcuts
    - Categorize by context (Global, Plan Mode)
    - Include in user documentation

42. **Code documentation**
    - Add JSDoc comments to complex functions
    - Document custom hooks
    - Document state management patterns

43. **Create developer guide**
    - Document component structure
    - Explain state management approach
    - List key files and their purposes
    - Include troubleshooting tips

44. **Final review and deployment**
    - Code review with team
    - Address feedback
    - Run linter and type checker
    - Deploy to staging
    - Final QA pass

---

**Estimated Total Time:** 21-29 days (4-6 weeks)

**Dependencies:**
- AppHeader component (should exist from app shell)
- AppShell authentication guard
- TanStack Query setup in app
- shadcn/ui components installed
- API endpoints implemented and deployed

**Success Criteria:**
- All CRUD operations functional
- Keyboard navigation works smoothly
- Limits enforced correctly
- At least one backlog constraint maintained
- Optimistic updates with rollback
- Mobile responsive
- Accessible (WCAG AA)
- No console errors
- Performance acceptable (95th percentile < 100ms for interactions)
