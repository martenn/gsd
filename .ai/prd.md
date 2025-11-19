# Product Requirements Document (PRD) - GSD (Getting shit done)

## 1. Product Overview

GSD (Getting shit done) is a focused personal productivity app inspired by GTD that helps solo users plan and execute work using multiple user-managed backlogs (the leftmost step), user-named intermediate lists (e.g., Week, Today), and a focused work mode. Users plan in plan mode (managing lists, tasks, and ordering) and execute in work mode (single-task focus with a short forecast), completing tasks which move to a separate Done archive. The MVP targets responsive web only, single-user accounts, with Google sign-in.

Objectives:

- Provide a simple, keyboard-first workflow for planning and doing work.
- Support multiple independent backlogs (e.g., garden, work, house) and a simple flow from backlogs (leftmost step) → intermediate lists (e.g., Week, Today) → Done.
- Encourage completion by focusing the user on the rightmost active list (typically today) and measuring tasks completed per day/week.

Target users:

- Solo users working in a managed way who want multiple backlogs and a lightweight weekly/daily planning cadence. Collaboration is out of scope for MVP.

Platforms:

- Responsive web app (desktop and mobile web). Online-only for MVP (no offline/PWA).

Assumptions and constraints:

- Single-user accounts only; delegation is modeled via separate backlogs.
- Keyboard-first interaction; no drag-and-drop in MVP.
- Limits: up to 10 non-Done lists and up to 100 tasks per list.

## 2. User Problem

Users with many areas of responsibility need a simple way to:

- Capture and organize tasks per area using named backlogs.
- Plan weekly and daily scopes without heavy project management overhead.
- Maintain a clear execution focus on the next task while knowing what follows.
- Track completed work over time to maintain momentum.

Existing tools are either too heavy (project management suites) or too lightweight (simple checklists without planning structure). Users need a streamlined, opinionated flow with multiple backlogs, a weekly plan, a daily focus list, and a distraction-free work mode.

## 3. Functional Requirements

3.1 Lists and Board

- Users can create, rename, delete, and reorder lists.
- List types: backlog, intermediate, done.
  - Users can mark/unmark any non-Done list as a backlog.
  - Done is special and hidden from the main board.
- Backlogs are always leftmost and may be visually grouped as a leftmost zone; users may have multiple backlogs.
  - Backlogs can be renamed and deleted (subject to at least-one-backlog constraint).
  - Backlogs are organized top-to-bottom to emphasize they are a single origin step (no inherent cross-backlog priority implied by vertical order).
- Flow is left-to-right: backlogs → intermediate lists (e.g., Week, Today) → Done.
- At least one backlog must always exist.
  - If deleting a backlog would result in zero backlogs, the system promotes the leftmost intermediate list to a backlog automatically; if no intermediate exists, deletion is blocked.
- Onboarding creates one Backlog, one intermediate list named Today (renamable/deletable), and Done.
  - Today is an intermediate by default and can be named in any way.
  - A list promoted to backlog cannot be deleted if it is the last remaining backlog.
- The active work list is the rightmost non-Done list (can be a backlog or an intermediate list).
  - If only backlogs exist (no intermediate lists), the rightmost backlog becomes the active list for work mode.
- Backlog/list selection UI in headers includes a searchable dropdown; remembers last used.
- Visual origin: the system assigns each backlog a color; tasks inherit origin color for MVP.

  3.2 Tasks

- A task belongs to exactly one list at a time.
- Users can create tasks in any non-Done list, move tasks between lists, reorder tasks within a list, and complete tasks from any list.
- Completing a task moves it to Done and sets completed_at.
- New tasks and tasks moved into a list are inserted at the top of the target list.
- Fields (MVP): title (required), description (optional), list_id, created_at, completed_at (nullable), order_index (strategy TBD). Color derives from the task’s origin backlog color.

  3.3 Plan Mode

- Full task and list management: create/rename/delete/reorder lists; create/edit/delete tasks; move tasks across lists; reorder within a list.
- Keyboard-first navigation: arrow keys primary; vim-style h/j/k/l alternates.
- Selection behaves like spreadsheet cells for navigation where relevant.
- “?” shortcut opens keyboard help overlay.
- Controls that would exceed limits (lists >10, tasks per list >100) are disabled.

  3.4 Work Mode

- Focused execution view that shows:
  - The top task of the active work list (rightmost non-Done; backlog or intermediate) as the bolded current task.
  - A short forecast of the next 2–3 tasks in that same list.
- Only core action is to mark the current task complete, which moves it to Done and advances the next task.

  3.5 Done View

- Separate read-only page with pagination (50 items per page).
- Retention: keep the last N completed tasks and delete oldest first (N=500 for MVP unless configured otherwise later).
- Display completion timestamps (stored in UTC, rendered in the user’s local timezone; week starts Monday).

  3.6 Data and Limits

- Lists: up to 10 non-Done lists.
- Tasks: up to 100 tasks per list.
- Consider performance for lists near limits; virtualization can be added if needed.

  3.7 Authentication and Account

- Google OAuth sign-in; include sign-out.
- Single-tenant user data: users can only view and manage their own tasks/lists.
- Hard delete for lists/tasks in MVP.
- Account deletion and minimal data export planned (post-MVP if needed).
- Minimal legal pages (privacy, terms) accessible.

  3.8 Metrics

- Track counts of tasks completed per user per day and per week.
- Store timestamps in UTC; present in browser timezone; week starts Monday.
- Goal: encourage 10+ tasks completed per user per week.

  3.9 Error Handling and UX

- When limits are reached, related controls/keys are disabled. No toasts or complex UX in MVP.
- Basic failure handling: show inline errors where an action fails (e.g., save failed) without elaborate flows.

  3.10 Mobile UX

- Show one list at a time with horizontal navigation (swipe left/right); backlog selected from dropdown or similar.
- Work mode is full-screen focus with only the Complete action and navigation actions (back to plan/done).

## 4. Product Boundaries

In scope (MVP):

- Multiple user-managed lists (backlogs and intermediate lists) with CRUD and manual reordering; users can mark/unmark lists as backlogs.
- Today list as a normal list created by default (deletable); Done list is special and hidden on board.
- Plan mode (full control) and work mode (focused complete-only action with forecast).
- Keyboard-first interaction; arrow keys and h/j/k/l; “?” help overlay.
- Dump mode for quick multi-line task creation into default backlog (max 10 lines; remove blanks; allow duplicates).
- Google OAuth, sign-out, and single-user data isolation.
- Done view with pagination and retention N=500.
- Metrics based on completed_at, local timezone presentation, week starting Monday.

Out of scope (MVP):

- Collaboration, shared lists, or multi-user boards.
- Drag-and-drop interactions.
- Offline/PWA and push notifications.
- Rich reminders, due dates, or calendar sync.
- Complex error handling, advanced onboarding, or coaching UX.

Open questions / post-MVP considerations:

- Order indexing strategy (fractional vs stepped integers) and any reindexing plan.
- Final keyboard map and discoverability details of the help overlay.
- Backlog color palette specifics and persistence rules.
- Error handling beyond disabled controls (optimistic updates, retries).
- Mobile gesture refinements (long press, toolbar design).
- How to indicate/select the active list clearly when only backlogs and Done exist (no intermediate lists).

## 5. User Stories

US-001 Create list

- Description: As a signed-in user, I can create a new list/backlog with a custom name so I can organize tasks by area.
- Acceptance Criteria:
  - Given I am authenticated, when I click Create List and enter a name, then a new non-Done list appears on the board at the leftmost position (or appended per current order rules) with the entered name and an assigned color.
  - The system prevents creation if there are already 10 non-Done lists (control disabled).

US-001A Mark list as backlog

- Description: As a user, I can mark or unmark a non-Done list as a backlog to designate it as a leftmost origin list.
- Acceptance Criteria:
  - Given a non-Done list, I can toggle its backlog status unless it would result in zero backlogs.
  - When marked as backlog, the list appears in the leftmost backlog zone.
  - If unmarking would result in zero backlogs, the action is blocked or another list is promoted to backlog.

US-002 Rename list

- Description: As a user, I can rename an existing list to maintain clarity as needs evolve.
- Acceptance Criteria:
  - Given any non-Done list, when I edit its name and save, then the new name is persisted and visible across views.

US-003 Delete list with destination selection

- Description: As a user, I can delete a list and must choose a destination list for its tasks so no tasks are lost.
- Acceptance Criteria:
  - When deleting a non-Done list, I am required to choose a destination list (defaulting to the default backlog).
  - After confirmation, the list is removed and all its tasks move to the chosen destination in the same relative order.
  - Deletion is prevented if it would leave zero non-Done lists.

US-003A Ensure at least one backlog

- Description: As a user, if I delete the last remaining backlog, the system ensures there is still at least one backlog.
- Acceptance Criteria:
  - If deletion would result in zero backlogs and an intermediate list exists, the leftmost intermediate list is automatically promoted to backlog and deletion proceeds.
  - If no intermediate lists exist, deletion is blocked with an inline explanation.

US-004 Reorder lists

- Description: As a user, I can reorder lists to define flow left to right.
- Acceptance Criteria:
  - Using keyboard controls, I can move a list left/right.
  - The rightmost non-Done list becomes the active work list.

US-004A Backlogs leftmost grouping

- Description: As a user, I see all backlog lists grouped leftmost, distinct from intermediate lists.
- Acceptance Criteria:
  - Backlog lists render in a leftmost zone and maintain top-to-bottom order.
  - Intermediate lists render to the right of backlogs.

US-005 Create task in a list

- Description: As a user, I can add a task to any non-Done list.
- Acceptance Criteria:
  - When I create a task, it is inserted at the top of the selected list with title required and optional description.
  - Controls are disabled if the target list has 100 tasks.

US-006 Edit task

- Description: As a user, I can edit a task’s title and description.
- Acceptance Criteria:
  - Given an existing task, when I save changes, then the task updates persist.

US-007 Delete task

- Description: As a user, I can delete a task I no longer need.
- Acceptance Criteria:
  - When I delete, the task is hard-deleted from storage and removed from the list UI.

US-008 Move task between lists

- Description: As a user, I can move a task from one list to another (e.g., Backlog → Week or Today).
- Acceptance Criteria:
  - When I move a task to a different list, it appears at the top of the destination list.
  - The task belongs to exactly one list at a time.

US-009 Reorder tasks within a list

- Description: As a user, I can reorder tasks within a list to set priority.
- Acceptance Criteria:
  - Using keyboard controls, I can move the selected task up/down.
  - The order is persisted via order_index.

US-010 Complete task in work mode

- Description: As a user, I can complete the current task in work mode to progress.
- Acceptance Criteria:
  - The top task in the active list is displayed as current; when I click Complete (or use a shortcut), the task moves to Done and the next task becomes current.
  - The forecast shows the next 2–3 tasks.

US-010A Work mode with only backlogs

- Description: As a user, when only backlogs exist (no intermediate lists), I can still use work mode.
- Acceptance Criteria:
  - The top backlog is treated as the active list; its top task is current.
  - Completing tasks behaves identically (move to Done, forecast shows next tasks).

US-011 Complete task in plan mode

- Description: As a user, I can mark a task complete in any list.
- Acceptance Criteria:
  - From any list (including non-active list), I can mark a task complete; it moves to Done and completed_at is recorded.

US-012 Work mode focus and forecast

- Description: As a user, I see a focused view of the current task with a short forecast.
- Acceptance Criteria:
  - Work mode renders the current task prominently and shows the next 2–3 tasks from the active list.
  - Only the Complete action is available for the current task.

US-013 Plan mode keyboard navigation

- Description: As a user, I can navigate and select items using the keyboard in plan mode.
- Acceptance Criteria:
  - Arrow keys navigate between cells; h/j/k/l act as alternates.
  - “?” opens an overlay showing keyboard shortcuts.

US-014 Dump mode quick add

- Description: As a user, I can paste or type multiple lines to quickly add tasks to the default backlog.
- Acceptance Criteria:
  - Up to 10 non-empty lines create up to 10 tasks at the top of the default backlog.
  - Blank lines are ignored; duplicates are allowed.

US-015 Done view browse

- Description: As a user, I can browse completed tasks on a separate page.
- Acceptance Criteria:
  - The Done page lists completed tasks in reverse chronological order, 50 per page, with pagination controls.
  - Only the last N=500 tasks are retained; older tasks are automatically deleted.

US-016 Metrics display

- Description: As a user, I can view counts of tasks I completed per day and per week.
- Acceptance Criteria:
  - The system aggregates completed_at timestamps into daily/weekly counts using the browser timezone; week starts Monday.

US-017 Authentication: Google sign-in/out

- Description: As a user, I can sign in with Google to access my tasks and sign out when finished.
- Acceptance Criteria:
  - Sign in via Google OAuth succeeds and grants access to only my data.
  - Sign out ends the session.

US-018 Authorization: data isolation

- Description: As a user, I can only view and manage my own lists and tasks.
- Acceptance Criteria:
  - API enforces per-user data scoping; cross-user access attempts are denied.

US-019 Limits enforcement

- Description: As a user, I am prevented from exceeding list/task limits.
- Acceptance Criteria:
  - Creation/move controls are disabled when limits are reached (lists >10, tasks per list >100).

US-020 Error feedback

- Description: As a user, I receive simple inline feedback if an action fails.
- Acceptance Criteria:
  - On failure (e.g., network/server), a succinct inline message appears near the action; no toasts or complex flows.

US-021 Mobile navigation

- Description: As a mobile user, I can view one list at a time and swipe between lists.
- Acceptance Criteria:
  - Horizontal swipe switches lists; work mode is full-screen with only Complete.

US-021A Mobile: backlog selection and active list clarity

- Description: As a mobile user, I can distinguish backlog lists and select an active list clearly when only backlogs exist.
- Acceptance Criteria:
  - Backlog lists are visually differentiated in the header or selector.
  - An explicit indicator shows which list is active for work mode; when only backlogs exist, the rightmost backlog is indicated.

US-022 Account deletion (planned)

- Description: As a user, I can delete my account and data.
- Acceptance Criteria:
  - A self-serve flow that hard-deletes user data. If deferred post-MVP, this story is tracked for later release.

US-023 Basic export (planned)

- Description: As a user, I can export my data minimally.
- Acceptance Criteria:
  - Provide a simple export (e.g., JSON or CSV). If deferred post-MVP, this story is tracked for later release.

## 6. Success Metrics

Primary KPI:

- Tasks completed per user per week (target: 10+ at MVP). Secondary: tasks completed per user per day.

Leading indicators:

- Ratio of tasks completed to tasks created.
- Active work sessions per user per week (entering work mode).
- Percentage of users with at least one task in Today each week.

Quality and performance:

- 95th percentile list interactions <100 ms for lists with up to 100 tasks.
- Error rate <1% of user actions.

Adoption and retention:

- New user activation: user creates at least one list and completes at least one task within 24 hours.
- Week 2 retention: user completes at least one task in week 2.
