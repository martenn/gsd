# GSD Post-MVP Roadmap

**Status:** MVP shipped — app live on mikrus (`getsd.bieda.it`), images built, prod running. **Sprint 1 Post-MVP active** — usability + small features driven by owner's daily-use feedback (DnD, Duplicate task, Move all tasks).
**Last Updated:** 2026-05-26
**Purpose:** Sequenced plan for the remaining tracker items now that deployment is no longer the blocker. The tracker stays the source of truth for line-item status; this doc is the roadmap and rationale.

---

## What's "done" vs. what's left

**Done (MVP scope):**

- Backend: 100% (30/30) — auth, lists, tasks, done archive, metrics, retention, color tracking, validation, security, error pages, dump mode.
- Frontend: Plan / Work / Done modes complete, Dump mode complete, UI primitives, forms, validation, recent UX polish (move up/down/top/bottom, collapsible lists, color cue on empty lists, compact New Task button, Cmd+Enter sticky multi-add, Work-mode active-list fix).
- Infra: Docker, CI/CD, mikrus host-networking refactor, TLS via mikrus panel, server bootstrap — **all live**.

**Not done (this doc plans):** tests, mobile responsive, keyboard-first navigation + help overlay, accessibility, a handful of small leftovers, plus the DnD decision.

---

## Sprint 1 — Confidence (~1 week)

**Goal:** Cover the routes that production traffic will exercise first. No new features.

| Slice | Owner | Est. | Notes |
| ----- | ----- | ---- | ----- |
| Backend unit: Auth module | - | 2d | OAuth callback path, JWT issuance, signout, guard behavior. 80%+ coverage target (in line with lists/tasks). |
| E2E: Auth | - | 0.5d | Already partly written; finish the OAuth round-trip with real cookie. |
| E2E: Lists flow | - | 1d | Full CRUD + backlog/intermediate/done constraints, limit enforcement. |
| E2E: Tasks flow | - | 1d | Create → move across lists → reorder → complete → appears in Done. |
| Perf: 100-task list render | - | 0.5d | Confirm p95 < 100 ms for the single-list endpoint with realistic data. |

**Exit criteria:** Backend ≥80% on auth, three new E2E specs green in CI, one perf number captured in tracker.

**Why first:** Backend feature work is frozen. The only thing that can break production now is regressions, and the tests don't exist yet. One week here protects every later sprint.

**Defer:** Frontend unit/component tests until UX is stable (Sprint 2/3 will move the components around).

---

## Sprint 2 — Mobile (~1.5 weeks)

**Goal:** Phase 7.10 in full. App is usable on a phone.

Build order (each step unblocks the next):

1. **Single-list full-width view** (2d) — the foundation. Hide the desktop two-column layout below `lg`, render one column at viewport width.
2. **Swipe gestures + position indicators** (1.5d) — left/right between lists; dots in the header.
3. **Backlog dropdown in header** (0.5d) — replace the leftmost-column UX since there's no column.
4. **Tap actions menu** (1d) — long-press / tap-on-row to expose Edit / Move / Complete / Delete without hover.
5. **Floating action button** (0.5d) — single primary "+" replaces the in-header `+` we just added when the screen is narrow.
6. **Work mode fullscreen** (1d) — bigger Complete button, no surrounding chrome.
7. **Dump mode bottom sheet** (0.5d) — replace centered modal on mobile.
8. **Done archive vertical scroll** (0.5d) — pagination control becomes infinite/load-more on mobile.

**Exit criteria:** All flows usable on a 390 px-wide viewport without horizontal scroll; tap targets ≥ 44 px; orientation change doesn't break state.

**Why second:** PRD calls mobile MVP. Now that the URL is shareable, every phone visit hits the desktop layout. Until this lands, expect support requests.

**Dependencies / watch-outs:**

- Swipe gestures will conflict with future drag-and-drop. Pick mobile-swipe ownership of horizontal-drag here; if DnD ships later, restrict it to `lg+` only.
- FAB and the new header "+" button (just shipped) need to coexist — FAB at `< lg`, header "+" at `lg+`. Don't render both.

---

## Sprint 3 — Keyboard-first & accessibility (~3 weeks)

**Goal:** Honor the PRD's "keyboard-first" pillar. Then make a screen reader work.

Phased, because each step depends on the previous.

### 3a. Selection state + arrow nav (~3 days)

- `KeyboardNavigationProvider` context: tracks `{ selectedListId, selectedTaskId }`.
- Arrow keys + h/j/k/l move between cells (spreadsheet feel).
- Visual focus ring on selected cell; persist per session.

### 3b. Action shortcuts (~2 days)

- `n` new task, `e` edit, `Space` complete, `Delete` delete, `m` move-to, `Cmd+ArrowUp/Down/Left/Right` move task. Mirror the now-implemented Move actions.
- Disabled-at-limit behavior matches existing menus.

### 3c. Command palette (~3 days)

- `Cmd+K` opens shadcn `Command`. Actions: jump to list, create task in list, switch mode, open help, sign out.

### 3d. Help overlay (~2 days)

- `?` opens `KeyboardHelpModal`. Categorized (Global / Plan / Work / Done). Built from a single source of truth so the shortcuts list can't drift.

### 3e. Accessibility audit (~6.5 days)

- Semantic HTML + ARIA roles pass (2d).
- Focus management follows keyboard selection (1d).
- Focus trap in modals (0.5d).
- `aria-live` regions for task create / complete / move (1d).
- Full Tab order audit, every interactive reachable (1d).
- Contrast pass for WCAG AA (0.5d).
- Skip-link to main content (0.5d).

**Exit criteria:** Every Plan-mode action reachable without a mouse; help overlay accurate; NVDA / VoiceOver announce create / complete / move; Lighthouse a11y ≥ 95.

**Why third:** This is the largest single chunk and the easiest to keep deferring. Doing it before DnD also pins the "keyboard remains primary" stance.

---

## Sprint 1 Post-MVP — Usability & small features (~1 week, active)

Owner is dogfooding the app — sprint scoped to friction noticed during real use plus the long-standing DnD ask. **Active scope:**

| # | Item | Est. | Decisions taken |
| - | ---- | ---- | --------------- |
| 1 | **Duplicate task** | 0.5–1d | Backend endpoint `POST /v1/tasks/:id/duplicate`. Copy keeps **exact same title**, description, and `originBacklogId`; lands directly below original (midpoint orderIndex with the next sibling). Frontend: new "Duplicate" item in `TaskActionsMenu`. |
| 2 | **Move all tasks from list → another list** | 1–1.5d | Backend endpoint `POST /v1/lists/:id/move-tasks` with `{ destinationListId }`. One transaction (mirrors `deleteWithTaskMove`). Frontend: **"Move all to" submenu in `ListActionsMenu`** (one-click like the task `Move to` submenu — no confirm dialog). Validate `source.count + dest.count ≤ 100` server-side; surface 400 inline on failure. Source list left as-is when emptied (user can collapse it manually). |
| 3 | **Drag & drop — iteration 1** | ~1d | `@dnd-kit/core` + `@dnd-kit/sortable`. **Desktop (lg+) only**. Scope this iteration: **tasks reorder within their own list** (most common case in dogfooding). Reuses existing `POST /v1/tasks/:id/reorder`. |
| 3b | **Drag & drop — iteration 2 (deferred)** | 2–3d | Cross-list task drag + list reorder within group (both currently usable via menus). Pulled out to its own iteration so iteration 1 ships clean and we get feedback on the feel first. Optional backend extension: extend `MoveTask` to accept `newOrderIndex` for one-call cross-list drops. |

Sequencing: items 1 and 2 first (small, independent, ship as separate PRs); DnD last (big, its own PR). Items 1 + 2 share `TaskActionsMenu.tsx` / `ListActionsMenu.tsx` patterns already in place. DnD is additive — won't conflict.

### Deferred from earlier Sprint 4 (not in current scope)

Move back into focus once Sprint 1 Post-MVP wraps. These are still on the books but not active.

| Item | Est. | Notes |
| ---- | ---- | ----- |
| Audit logging (auth events) | 1d | Optional; "who logged in when" trail. |
| Extract `TaskListContainer` / `EmptyListState` from `ListColumn` | 0.5d | Cosmetic refactor; worth doing before DnD ideally — currently deferring since DnD doesn't strictly need it. |
| Replace mock userIds in remaining E2E tests | 0.25d | Test-only cleanup. |
| Swagger / OpenAPI decorators on all endpoints | 1d | Helpful if/when third parties hit the API. |
| Color hex DTO validation | 0.5d | Plug the small validation gap noted in tracker. |
| Fractional ordering strategy | 1d | Only matters if 1000-step orderIndex hits collisions; unlikely. |

### Drag & drop — scoped for Sprint 1 Post-MVP

`@dnd-kit/core` + `@dnd-kit/sortable`, ~3–4 days, frontend-only. Backend needs no required changes (optional `MoveTask` extension to accept `newOrderIndex` saves one round-trip on cross-list drops — apply if it cuts complexity, skip otherwise). Risks: cross-list optimistic state, 100-task limit, mobile-swipe conflict (addressed by scoping DnD to `lg+`).

**Decision:** desktop (`lg+`) only. Mobile DnD revisited after Sprint 2 (Mobile) lands swipe gestures.

---

## Doc housekeeping (one-shot, do before Sprint 1)

- [ ] In `.ai/project-tracker.md`, mark Phase 8 deployment items ✅ (all 9). Update `Overall MVP Completion`. Bump `Last Updated`.
- [x] Post-Deployment Backlog cleaned up and `ux-improvements-backlog.md` deleted — all 6 items merged.
- [x] CLAUDE.md MVP-closure pass done; DnD stance reworded as "out of current scope."
- [ ] Once Sprint 1 Post-MVP ships DnD, update CLAUDE.md's "Keyboard-first" stance and the Important Notes accordingly (DnD becomes desktop-supported, keyboard remains primary).

---

## Cross-cutting risks

- **Backend feature freeze.** The plan above assumes no new backend work. Adding even one feature (audit log endpoint, MoveTask extension) needs a matching test slice in Sprint 1.
- **Keyboard nav and mobile-swipe both want horizontal arrow keys / horizontal gestures.** Sprint 2 owns horizontal swipe; Sprint 3a owns left-right list switching with keyboard. Different surfaces, no conflict — but worth re-reading both implementations once Sprint 3 starts.
- **Test fixtures.** Once Sprint 1 introduces real auth E2E (cookie-bearing requests), reuse the same fixture across Sprint 1 tests AND any later frontend Playwright runs in Sprint 4. Don't build it twice.

---

## Sprint sequencing summary

```
active → Sprint 1 Post-MVP (Usability: Duplicate, Move-all, DnD, ~1w)
now    → Sprint 1 (Confidence,        ~1w)
       → Sprint 2 (Mobile,            ~1.5w)
       → Sprint 3 (Keyboard+a11y,     ~3w)
       → Sprint 4 (Deferred polish,   ~0.5w — see "Deferred from earlier Sprint 4")
```

Total est: ~7 weeks of focused work, with hard dependencies only between Sprint 3a → 3b → 3c → 3d.

---

## Open questions for the owner

1. Mobile vs. accessibility — which user complaint hits first? If you have telemetry on viewport widths after launch, Sprint 2 may compress.
2. Keep DnD out of MVP, or revisit after Sprint 3 with a "MVP+1" tag? PRD wording needs to align with the answer.
3. Is `getsd.bieda.it` getting external linking yet? If yes, push Sprint 1 (E2E confidence) earlier; if no, the parallelism with Sprint 2 buys time.
