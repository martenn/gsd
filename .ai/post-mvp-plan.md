# GSD Improvements

Flat priority list of things to do next. **Top = next pick.** Reorder by moving items up/down. Move shipped items into the Done log at the bottom.

**Status:** MVP shipped — app live on mikrus (`getsd.bieda.it`). Backend feature-complete, Plan/Work/Done/Dump modes live, drag-and-drop (within and across lists), task duplicate, move-all-tasks, compact list/section headers, app icon.

**Last Updated:** 2026-05-29

---

## Up next

1. **Visual feedback during cross-list drag** — currently the task preview disappears when crossing into another column. Drop logic works, but the user loses the visual anchor. Use `@dnd-kit`'s `DragOverlay` to render a floating copy of the dragged task that follows the cursor regardless of which container it's over.
2. **Auth unit tests** (2d) — OAuth callback, JWT issuance, signout, guard. 80%+ coverage target to match lists/tasks modules.
3. **E2E: Auth flow** (0.5d) — finish the OAuth round-trip with a real cookie. Most of it already drafted.
4. **E2E: Lists flow** (1d) — full CRUD + backlog/intermediate/done constraints + limit enforcement.
5. **E2E: Tasks flow** (1d) — create → move across lists → reorder → complete → appears in Done.
6. **Perf: 100-task list render** (0.5d) — confirm p95 < 100 ms with realistic data; capture the number.

## Mobile (Phase 7.10)

Until these land, every phone visit hits the desktop layout. Build top-down (each step unblocks the next).

- **Single-list full-width view** (2d) — hide desktop two-column layout below `lg`, render one column at viewport width.
- **Swipe gestures + position indicators** (1.5d) — left/right between lists; dots in the header.
- **Backlog dropdown in header** (0.5d) — replaces the leftmost-column UX.
- **Tap actions menu** (1d) — long-press / tap-on-row to expose Edit / Move / Complete / Delete without hover.
- **Floating action button** (0.5d) — single primary `+` when the screen is narrow. Coexist with the header `+`: FAB at `< lg`, header `+` at `lg+`.
- **Work mode fullscreen** (1d) — bigger Complete button, no surrounding chrome.
- **Dump mode bottom sheet** (0.5d) — replace centered modal on mobile.
- **Done archive vertical scroll** (0.5d) — pagination becomes infinite/load-more.
- **Watch-out:** mobile-swipe vs DnD. DnD is already desktop-only (`lg+`); keep that boundary.

## Keyboard-first

Phased — each step depends on the previous.

- **Selection state + arrow nav** (3d) — `KeyboardNavigationProvider` context with `{ selectedListId, selectedTaskId }`; arrow keys + h/j/k/l move between cells; visual focus ring; persist per session.
- **Action shortcuts** (2d) — `n` new task, `e` edit, `Space` complete, `Delete` delete, `m` move-to, `Cmd+ArrowUp/Down/Left/Right` move task. Mirror the menu actions.
- **Command palette** (3d) — `Cmd+K` opens shadcn `Command`. Actions: jump to list, create task in list, switch mode, open help, sign out.
- **Help overlay** (2d) — `?` opens `KeyboardHelpModal`. Categorized (Global / Plan / Work / Done). Single source of truth so the shortcuts list can't drift.

## Accessibility

- **Semantic HTML + ARIA roles pass** (2d).
- **Focus management** (1d) — focus follows keyboard selection.
- **Focus trap in modals** (0.5d).
- **aria-live regions** (1d) — announce task create / complete / move.
- **Full Tab-order audit** (1d) — every interactive element reachable.
- **Contrast pass** (0.5d) — WCAG AA.
- **Skip-link to main content** (0.5d).
- **Exit criteria:** every Plan-mode action reachable without a mouse; NVDA/VoiceOver announce create/complete/move; Lighthouse a11y ≥ 95.

## Smaller items / polish

- **Audit logging** (auth events, 1d) — optional "who logged in when" trail.
- **Extract `TaskListContainer` / `EmptyListState`** from `ListColumn` (0.5d) — cosmetic refactor.
- **Replace mock userIds** in remaining E2E tests (0.25d).
- **Swagger / OpenAPI decorators** on all endpoints (1d).
- **Color hex DTO validation** (0.5d) — small validation gap noted in tracker.
- **Fractional ordering strategy** (1d) — only matters if 1000-step orderIndex hits collisions.

## Cross-cutting notes

- Backend feature freeze still assumed for everything above. New backend work needs a matching test slice.
- Keyboard nav and mobile-swipe both want horizontal arrows/gestures, but different surfaces — re-check the interaction when both implementations are in flight.
- Reuse auth E2E fixture (once written) for any later Playwright runs.

---

## Done log

Recent ships (newest first). Move items here when merged.

- 2026-05-29 — App favicon — task-list + check sweep, light/dark variants.
- 2026-05-29 — DnD iteration 2 — cross-list drag with backend `MoveTask` accepting `newOrderIndex`; optimistic patch on `useMoveTask`.
- 2026-05-28 — `+` icon clustered next to BACKLOGS / LISTS titles; Card padding overridden to `gap-0 py-0` to reclaim ~24px vertical per list.
- 2026-05-28 — Compact list-column / section headers; `validate:full` script.
- 2026-05-27 — Task list height fills column (no more 600px cap on intermediates); thicker task color bar; DnD drop optimistic update.
- 2026-05-27 — DnD iteration 1 (in-list task reorder, desktop only via `@dnd-kit`).
- 2026-05-26 — Duplicate task, Move all tasks (submenu in `ListActionsMenu`), list reorder (move up/down for backlogs, left/right for intermediates).
- 2026-05-26 — Move up/down/top/bottom for tasks; Cmd+Enter sticky multi-add; collapsible lists; color cue on empty lists; compact New Task button; Work-mode active-list fix; backlog column overflow fix.
