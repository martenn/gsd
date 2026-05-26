# GSD UX Improvements Backlog

Captured ideas surfaced during day-to-day Plan Mode use. None are scheduled yet — pull into a sprint when polish work begins. See `project-tracker.md` for sprint planning.

**Last Updated:** 2026-05-26 (items 1–6 implemented on branch `worktree-ux-improvements-update` pending merge)

> **Status (per item) on branch `worktree-ux-improvements-update`:**
> 1. ✅ Color cue — 4 px left accent on the Card using `list.color` (applied to all non-Done lists).
> 2. ✅ Empty card shrink — task area only renders when non-empty or while creating; no more `max-h-[600px]` reservation or "No tasks yet" filler.
> 3. ✅ Collapsible lists — chevron toggle in `ListHeader`; state persisted in `localStorage` via new `useListCollapsed(listId)` hook. Applies to all non-Done lists.
> 4. ✅ Sticky multi-add — **Cmd/Ctrl+Enter** creates the task and keeps the creator open + refocused; plain Enter still creates & closes; Esc cancels. Hint text updated.
> 5. ✅ Move to top / Move to bottom — new `TaskActionsMenu` items, alongside Move up / Move down. Top uses `siblings[0].orderIndex + 1000` (matching backend `ORDER_STEP`); bottom uses `siblings[last].orderIndex / 2`.
> 6. ✅ Compact New Task trigger — wide row removed from `ListColumn`; small `+` icon button now lives in `ListHeader` next to the count badge. Disabled with tooltip when at task limit.

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

## 5. Move task to top / bottom of list

**Problem:** Move up / down (added 2026-05-26) only shifts a task one slot at a time. Moving a task from the bottom of a 30-item list to the top means 29 clicks.

**Idea:** Add **Move to top** and **Move to bottom** items to `TaskActionsMenu`, alongside the existing Move up / Move down. Disabled at the respective edges.

**Implementation sketch:**

- New newOrderIndex computation:
  - **Move to top**: `siblings[0].orderIndex + 1` (or `+ ORDER_STEP` for headroom; backend `OrderIndexHelper` uses step=1000).
  - **Move to bottom**: `siblings[siblings.length - 1].orderIndex / 2` (mirror of the current down-bottom fallback).
- Calls the same `POST /v1/tasks/:id/reorder` endpoint with `newOrderIndex`; no backend change.

**Where:** `apps/frontend/src/components/plan/TaskActionsMenu.tsx` (extend menu + helpers).

**Open questions:**

- Group as a `Move…` submenu (Top / Up / Down / Bottom / To list…) to reduce dropdown noise?
- Keyboard shortcuts? (defer to keyboard-navigation work — likely `Cmd+Shift+ArrowUp/Down`.)

---

## 6. Compact the "New Task" button

**Problem:** The full-width `New Task` row inside every `ListColumn` (between header and task list, ~32 px tall + padding) eats vertical space, especially noticeable on cards with only a few tasks and across many lists.

**Idea options (pick one when implementing):**

- **Inline in header:** small `+` icon button next to the list name / count badge in `ListHeader`. Removes the dedicated row entirely.
- **Compact icon-only button:** shrink to a 24×24 `+` button aligned right under the header, no full-width row.
- **Keyboard-first:** keep the affordance discoverable but tiny (icon + tooltip "New task (N)"); rely on `N` shortcut once keyboard nav lands.

**Where:** `apps/frontend/src/components/plan/ListColumn.tsx` (the `<div className="border-b border-border px-3 py-2 bg-background">…<Button>New Task</Button>` block) and `ListHeader.tsx` if moving the trigger into the header.

**Open questions:**

- Header-inline conflicts with `ListActionsMenu` (currently right-aligned)? Decide layout before coding.
- Show the inline `InlineTaskCreator` form where the row used to be, or expand into the task list area at the top?
- Does the limit-disabled state (`tasks.length >= maxTasks`) still need an explicit hint when the trigger is icon-only? (Tooltip is probably enough.)

---

## Cross-cutting notes

- All items are pure frontend; no backend or schema changes required.
- Items 1 + 2 + 6 share a file (`ListColumn.tsx`) and can ship together — item 6 also touches `ListHeader.tsx` if the trigger moves into the header.
- Item 4 overlaps with future Dump Mode UX polish — keep them aligned.
- Item 5 extends the same `TaskActionsMenu` updated on 2026-05-26 (Move up/down); revisit submenu structure when adding it.
