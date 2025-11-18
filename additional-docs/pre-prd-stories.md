# User Stories

## Authentication

### US-001: User Registration

**As a** new user
**I want to** register using my Google account
**So that** I can access the task management app without managing passwords

**Acceptance Criteria:**

- User clicks "Sign in with Google" button
- Google OAuth flow completes successfully
- Upon first login, user sees default board with Backlog, Week, Today, and Done lists
- User is redirected to Manage mode view

### US-002: User Login

**As a** registered user
**I want to** log in using my Google account
**So that** I can access my tasks

**Acceptance Criteria:**

- User clicks "Sign in with Google" button
- Google OAuth flow completes successfully
- User sees their existing board with all lists and tasks
- User sees only their own tasks (data isolation)

### US-003: User Logout

**As a** logged-in user
**I want to** log out of the application
**So that** my tasks remain private on shared devices

**Acceptance Criteria:**

- User clicks logout button
- Session is terminated
- User is redirected to login screen

---

## Board & List Management

### US-004: View Board in Manage Mode

**As a** user
**I want to** see all my task lists side-by-side
**So that** I can get an overview of all my tasks

**Acceptance Criteria:**

- User switches to Manage mode
- All lists are displayed as vertical columns arranged horizontally
- Backlogs are leftmost, custom lists in middle, Done list rightmost
- Each task shows name and source tag (colored badge/label)
- Lists are horizontally scrollable on mobile
- Tasks within each list are stacked vertically, top = highest priority

### US-005: Create Custom List

**As a** user
**I want to** create a new custom list
**So that** I can organize tasks according to my workflow

**Acceptance Criteria:**

- User clicks "Add List" button in Manage mode
- User enters list name
- New list appears in the board between backlogs and Done list
- New list is empty by default

### US-006: Create Backlog List

**As a** user
**I want to** create a new backlog list
**So that** I can organize tasks by context (work, garden, house, etc.)

**Acceptance Criteria:**

- User clicks "Add Backlog" button in Manage mode
- User enters backlog name
- New backlog appears on the left side of the board
- Tasks created in this backlog get tagged with its name/color

### US-007: Rename List

**As a** user
**I want to** rename any list
**So that** I can adjust my organization as needs change

**Acceptance Criteria:**

- User clicks rename option for a list in Manage mode
- User enters new name
- List is renamed immediately
- Done list cannot be renamed

### US-008: Delete List

**As a** user
**I want to** delete lists I no longer need
**So that** my board stays organized

**Acceptance Criteria:**

- User clicks delete option for a list in Manage mode
- List is deleted immediately
- Tasks in deleted list are permanently removed
- Done list cannot be deleted
- If deleting the last backlog, it cannot be deleted (at least one backlog must remain)

### US-009: Reorder Lists

**As a** user
**I want to** reorder custom lists
**So that** I can arrange them according to my workflow

**Acceptance Criteria:**

- User drags lists to reorder them in Manage mode
- Backlogs always remain leftmost
- Done list always remains rightmost
- Custom lists can be reordered between backlogs and Done

### US-010: Set Default Backlog

**As a** user
**I want to** designate one backlog as default
**So that** tasks created in Pure Create mode go to the right place

**Acceptance Criteria:**

- User clicks "Set as Default" button on a backlog in Manage mode
- That backlog is marked as default
- Only one backlog can be default at a time
- Tasks created in Pure Create mode go to default backlog

---

## Task Management

### US-011: Create Task in Manage Mode

**As a** user
**I want to** add tasks to any list
**So that** I can capture work items in the right context

**Acceptance Criteria:**

- User clicks "+" button on any list in Manage mode
- User enters task name (required)
- User can optionally expand to add description
- Task appears at bottom of the list
- If created in a backlog, task is tagged with that backlog's source

### US-012: Edit Task

**As a** user
**I want to** edit task name and description
**So that** I can update task details as needs change

**Acceptance Criteria:**

- User clicks on task in Manage mode
- User can edit name and description
- Changes are saved immediately
- Source tag cannot be changed

### US-013: Delete Task

**As a** user
**I want to** delete tasks that are no longer relevant
**So that** my lists stay focused

**Acceptance Criteria:**

- User clicks delete option for a task in Manage mode
- Task is deleted immediately from the list
- Deleted task does not appear in Done list

### US-014: Move Task Between Lists

**As a** user
**I want to** drag tasks between lists
**So that** I can move work through my workflow stages

**Acceptance Criteria:**

- User drags task from one list to another in Manage mode
- Task moves to target list
- Task can be dropped at any position in target list
- Task retains its source tag when moved
- Tasks can be moved directly between any lists (e.g., backlog → today, skipping week)

### US-015: Reorder Tasks Within List

**As a** user
**I want to** drag tasks up and down within a list
**So that** I can prioritize work (top = most important)

**Acceptance Criteria:**

- User drags task to different position in same list in Manage mode
- Task position updates immediately
- Tasks at top of list are highest priority

### US-016: Mark Task Complete from Any List

**As a** user
**I want to** mark tasks complete even when they're not on my today list
**So that** I can complete delegated or unexpected work

**Acceptance Criteria:**

- User clicks "complete" action on task in any list (Manage mode)
- Task disappears from current list
- Task appears in Done list with completion date
- Source tag is preserved

---

## Pure Create Mode

### US-017: Switch to Pure Create Mode

**As a** user
**I want to** switch to Pure Create mode
**So that** I can rapidly capture multiple tasks

**Acceptance Criteria:**

- User clicks "Pure Create" mode button
- Interface shows only a text input field
- All lists and other UI elements are hidden

### US-018: Rapid Task Creation

**As a** user
**I want to** type task names and press enter repeatedly
**So that** I can quickly brain-dump tasks

**Acceptance Criteria:**

- User types task name in input field
- User presses Enter
- Task is saved to default backlog
- Input field clears and remains focused
- User can immediately type next task
- Tasks have name only (no description in this mode)

---

## Work Mode

### US-019: Switch to Work Mode

**As a** user
**I want to** switch to Work mode
**So that** I can focus on completing my most important task

**Acceptance Criteria:**

- User clicks "Work" mode button
- Interface shows only current task and forecast
- All other UI elements are hidden

### US-020: View Current Task

**As a** user in Work mode
**I want to** see the top task from my rightmost non-empty list
**So that** I know what to work on next

**Acceptance Criteria:**

- Work mode displays the task at top of rightmost non-empty list
- Task is shown prominently (bolded/large)
- Task name and list name are visible
- If all lists are empty, show message "No tasks, enjoy your day!"

### US-021: View Forecast

**As a** user in Work mode
**I want to** see the next 2-3 tasks from the same list
**So that** I can anticipate upcoming work

**Acceptance Criteria:**

- Work mode displays next 2-3 tasks below current task
- Forecast tasks are read-only (no interaction)
- Forecast shows task names only
- If fewer than 2-3 tasks remain, show only what's available

### US-022: Complete Current Task in Work Mode

**As a** user in Work mode
**I want to** mark the current task complete
**So that** I can move to the next task

**Acceptance Criteria:**

- User clicks "Complete" button
- Current task disappears and moves to Done list
- Next task from forecast becomes current task
- Forecast updates to show next 2-3 tasks
- Optional: visual feedback (brief celebration animation)

---

## Planning Workflows

### US-023: Weekly Planning

**As a** user on Sunday evening
**I want to** review leftovers and plan my week
**So that** I can start Monday with clear priorities

**Acceptance Criteria:**

- User opens app in Manage mode
- User sees leftover tasks in Today and Week lists
- User can delete irrelevant tasks or move them back to backlogs
- User drags tasks from backlogs to Week list
- User drags some tasks from Week to Today for tomorrow
- User reorders tasks in each list by priority

### US-024: Daily Planning

**As a** user each morning
**I want to** review my week list and select today's tasks
**So that** I have a focused daily plan

**Acceptance Criteria:**

- User opens app in Manage mode
- User reviews leftover tasks in Today list (from yesterday)
- User cleans up Today list (complete, delete, or move back)
- User drags tasks from Week list to Today list
- User reorders Today list by priority

---

## Reporting & Done List

### US-025: View Completed Tasks

**As a** user
**I want to** view all my completed tasks
**So that** I can review what I've accomplished

**Acceptance Criteria:**

- User navigates to "Completed Tasks" view (separate from modes)
- View shows list/table of completed tasks
- Each task shows: name, description, source tag, date completed
- Tasks are sorted by completion date (newest first)
- No filters or search in initial version

### US-026: Auto-Archive Old Completed Tasks

**As a** user
**I want** old completed tasks to be automatically deleted
**So that** my Done list doesn't grow unbounded

**Acceptance Criteria:**

- System keeps most recent 50-100 completed tasks (configurable)
- Older completed tasks are automatically deleted
- User doesn't see or interact with this process

---

## Mobile Responsive Behavior

### US-027: Horizontal Scrolling on Mobile (Manage Mode)

**As a** mobile user
**I want to** scroll horizontally through my lists
**So that** I can access all lists on a small screen

**Acceptance Criteria:**

- On mobile, lists are arranged horizontally
- User swipes left/right to see different lists
- Drag-and-drop still works on mobile (drag task, scroll to target list, drop)
- Backlog lists may be expandable (accordion) to save space

### US-028: Mobile Work Mode

**As a** mobile user
**I want** Work mode to work the same as desktop
**So that** I can focus on completing tasks on any device

**Acceptance Criteria:**

- Work mode shows same interface on mobile and desktop
- Current task is prominently displayed
- Forecast is visible below
- Complete button is easily tappable

---

## Open Points / Future Enhancements

### Task Source Reporting (Not in MVP)

- Report completed tasks grouped by source (e.g., "5 garden tasks this week")
- Time-based filtering (this week, last week, this month)

### Advanced Task Properties (Not in MVP)

- Due dates
- Additional metadata beyond name + description
- Recurring tasks

### Work Mode Enhancements (Open Point)

- Display which list the current task belongs to
- Decide on visual presentation

### Done List Visibility in Manage Mode (Open Point)

- Should Done list be hidden by default in Manage mode?
- Toggle to show/hide Done list?

### Completion Visual Feedback (Nice-to-have)

- Celebration visual feedback when completing tasks (emoticon, animation, etc.)
- Undo action for accidental completions (not in MVP)

### Backlog Accordion on Mobile (TBD)

- Expandable/collapsible backlogs to save horizontal space
- UX pattern to be determined
