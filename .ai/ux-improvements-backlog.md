# GSD UX Improvements Backlog

Captured ideas surfaced during day-to-day Plan Mode use. None are scheduled yet — pull into a sprint when polish work begins. See `project-tracker.md` for sprint planning.

**Last Updated:** 2026-05-26

---

## 1. Empty backlog still shows origin color

**Problem:** When a backlog has zero tasks, the card has no visible color cue, so users can't tell at a glance which backlog they're looking at (color is only rendered on `TaskRow`s via `task.color`).

**Idea:** Render the backlog's `list.color` somewhere on the card itself when empty (or always) — e.g., a 4 px left border on the card matching task rows, a colored dot next to the name, or a tinted header background.

**Where:** `apps/frontend/src/components/plan/ListColumn.tsx` (Card wrapper) and/or `ListHeader.tsx`. Color comes from `list.color` (`ListDto.color: string | null`).

**Open questions:**

- Apply to all lists (intermediate + backlog) or only backlogs?
- Color the whole header strip, just an accent bar, or both?

---

## 2. Empty backlog: shrink card height

**Problem:** Empty backlog cards reserve the full task-area height (≈600 px via `max-h-[600px]` on the scroll container) and the title sits visually low because the `New Task` toolbar + empty-state filler push it down.

**Idea:** When `tasks.length === 0` (and not creating a task), let the card collapse to title + "New Task" button only — drop the `max-h-[600px]` reservation and the "No tasks yet" 8-unit empty spacer.

**Where:** `apps/frontend/src/components/plan/ListColumn.tsx` lines around `flex-1 overflow-y-auto max-h-[600px]` and the empty state div.

**Open questions:**

- Same treatment for empty intermediate lists?
- Should the title visually align flush-top in the collapsed state (move padding into the body, not the header)?

---

## 3. Backlogs collapsible to name-only header

**Problem:** With multiple backlogs in the left column, vertical space is scarce. Users with 3+ backlogs often only need one expanded at a time.

**Idea:** Add a fold/unfold toggle on each backlog's header. Collapsed state = name + task count badge only (no body, no New Task button). Persist per-user (localStorage is fine for MVP; postpone server persistence).

**Where:** `apps/frontend/src/components/plan/ListHeader.tsx` (add chevron toggle), `ListColumn.tsx` (conditionally render body), new tiny hook for per-list collapsed state.

**Open questions:**

- Backlogs only, or also intermediate lists?
- Auto-collapse all but the active/selected one?
- Keyboard shortcut? (defer to keyboard-navigation work)

---

## 4. Inline task creator: stay open for multi-add

**Problem:** Adding several tasks to a backlog in one sitting requires: click "New Task" → type → Enter → click "New Task" → type → Enter … Click-per-task is annoying when dumping a list of items.

**Idea:** After submitting in `InlineTaskCreator`:

- **Enter** → save current task, clear input, **keep the creator open** with focus, ready for the next.
- **Cmd/Ctrl+Enter** or **Esc** → save current task and close the creator.
- **Esc on empty input** → just close (current behavior).

This mirrors the Dump Mode flow but inline, keeping single-task UX close to the spreadsheet feel the PRD calls for.

**Where:** `apps/frontend/src/components/plan/InlineTaskCreator.tsx`.

**Open questions / to confirm with user:**

- Default Enter behavior: "save & continue" (sticky) vs current "save & close". User suggested sticky by default, with Cmd+Enter to close — confirm before implementing.
- Should the creator auto-close after N seconds of inactivity, or only on explicit Esc/Cmd+Enter / blur?
- Show a subtle "Press Cmd+Enter to finish" hint while creator is open in sticky mode?

---

## Cross-cutting notes

- All four items are pure frontend; no backend or schema changes required.
- Items 1 + 2 share a file (`ListColumn.tsx`) and can ship together.
- Item 4 overlaps with future Dump Mode UX polish — keep them aligned.
