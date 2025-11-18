<conversation_summary>
<decisions>

1. Target users: solo users working in a managed way; single-user only (no collaboration); delegation modeled as separate backlogs.
2. Platforms: responsive web only; online-only (no offline/PWA for MVP).
3. Lists model: free-form user-managed lists (no “system lists” beyond a special Done); default onboarding creates Backlog + Today + Done; Today is deletable.
4. Active work list: the rightmost non-Done list; Done is hidden from the main board.
5. Task membership: a task belongs to exactly one list at a time; completing any task moves it to Done.
6. Undo: no undo for MVP; users can recreate tasks if needed.
7. Done view: separate read-only page; no grouping; 50 items per page; retain last N and delete oldest first (N accepted per recommendation).
8. Limits: maximum 10 non-Done lists; maximum 100 tasks per list; color palette must support up to 10 backlogs.
9. List CRUD: create/rename/delete/reorder allowed; at least one backlog must remain; deleting a list requires choosing a destination (defaults to default backlog).
10. Ordering and movement: MVP is keyboard-first (no drag-and-drop); new/moved tasks insert at the top of target list.
11. Keyboard scheme: arrow keys as primary; vim-style (h/j/k/l) as alternates; “?” shortcut for help; Excel-like cell navigation and selection behavior in plan mode.
12. Backlog selection UI: dropdown/select (searchable) in the backlog column header; remembers last used.
13. Mobile UX: show one list at a time; swipe left/right to switch lists; work mode is full-screen focus with only “Complete”.
14. Dump mode: multi-line input to default backlog; duplicates allowed; blank lines removed; capped at 10 lines per submission.
15. Visual origin: system assigns backlog colors; tasks can retain origin coloring (system-chosen for MVP).
16. Data model (MVP): task fields include title, description, list_id, created_at, completed_at, order_index (scheme TBD); origin color derived by system.
17. Auth: NestJS backend with Google-only sign-in; include sign-out and minimal legal pages; hard delete for lists/tasks; account deletion and minimal export planned.
18. Metrics: simplest approach—count tasks in Done per day and per week; goal: 10+ tasks per week; use user’s timezone (store UTC; present in browser tz); week starts Monday.
19. Handling limits/errors: disable buttons/keys when limits are hit; no extra UX (e.g., no toasts) for MVP.
    </decisions>
    <matched_recommendations>
20. Use the rightmost non-Done list as the active work list; keep Done hidden from the board.
21. Enforce single-list membership per task; preserve visual origin via color (system-assigned).
22. Provide a separate Done page with pagination; retain last N items (adopted N from recommendation); no grouping for MVP.
23. Ship keyboard-first navigation and reordering; defer drag-and-drop.
24. Insert new/moved tasks at the top of the target list; allow preference later (post-MVP).
25. Use arrow keys as primary and vim-style as alternates; add a “?” keyboard shortcut overlay.
26. Mobile: one list visible at a time; swipe between lists; keep work mode focused with “Complete” only.
27. Dump mode: multi-line input creating multiple tasks in default backlog; remove blanks; cap entries (10 lines).
28. Limits: cap lists at 10 (excluding Done) and tasks at 100 per list; design for performance accordingly.
29. Auth: Google OAuth via NestJS; minimal legal and account deletion; hard delete for MVP.
30. Metrics: track tasks completed per day/week using browser timezone; group and display counts simply.
31. Deactivate controls when limits are reached instead of complex guidance or notifications.
    </matched_recommendations>
    <prd_planning_summary>
    Main functional requirements

- Lists: user can create/rename/delete/reorder lists; at least one backlog must exist; Done exists but is not shown on the board; Today created by default but deletable.
- Active work list: automatically the rightmost non-Done list; work mode focuses on the top task with minimal UI.
- Tasks: create in any list (except Done), move between lists, manually reorder, complete from any list; completion moves to Done.
- Dump mode: multi-line quick add (≤10 lines) to default backlog; duplicates allowed; blank lines ignored.
- Done view: separate read-only page, paginated 50/page, retains last N items (delete oldest first).
- Navigation and controls: keyboard-first (arrows + h/j/k/l); selection behaves like cells; insert-at-top on create/move; controls disabled at limits.
- Mobile: show a single list at a time with horizontal navigation; work mode is full-screen with only “Complete”.
- Data model: task(title, description, list_id, created_at, completed_at, order_index[TBD]); list(name, type flag for Done, order); color system assigned.
- Auth: NestJS backend with Google sign-in; sign-out; hard delete; minimal legal; account deletion and basic export.
  Key user stories and usage paths
- As a solo user, I create my backlogs/lists and reorder them left→right to define my flow.
- I add tasks quickly via dump mode to the default backlog and refine later.
- I plan by moving tasks across lists (e.g., Backlog → Today) and ordering them with the keyboard.
- I work in work mode by focusing on the rightmost non-Done list and completing tasks.
- I review completed tasks in the Done page (read-only, paginated).
- On mobile, I navigate lists one at a time and complete tasks in a focused view.
  Important success criteria and ways to measure them
- Core KPI: tasks completed per user per day/week (browser timezone, week starts Monday).
- Target: ≥10 tasks completed per user per week at MVP.
- Instrument minimal events to compute counts from completed_at; store timestamps in UTC and render in local timezone.
  Additional implementation notes
- Limits: ≤10 non-Done lists; ≤100 tasks per list; ensure UI disables exceeding actions.
- Performance: design for up to 100 tasks per list; consider virtualization if approaching limits.
- Accessibility: aim for full keyboard navigation; additional a11y only if it doesn’t block features for MVP.
  </prd_planning_summary>
  <unresolved_issues>
- Exact order_index strategy (fractional vs stepped integers) and any periodic reindexing approach.
- Final keyboard map (complete list of shortcuts) and discoverability details of “?” overlay.
- Exact retention N for Done (accepted recommendation implicitly; confirm N=500 or another value).
- Backlog color assignment and persistence rules (system chosen palette specifics).
- Error handling strategy beyond disabling controls (e.g., server failures, optimistic updates).
- Mobile gestures and controls details (long-press behaviors, action toolbar design).
  </unresolved_issues>
  </conversation_summary>
