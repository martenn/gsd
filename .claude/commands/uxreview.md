---
description: UX design review for a GSD change or reported problem
---

# UX Design Review

Your task is to give the UX design opinion on a change, a reported problem, or a
proposed interaction — before any code is written.

## Context

1. **Project stance and domain rules:**
   @CLAUDE.md

2. **Frontend standards:**
   @.ai/standards/frontend-development.md

## Step 1: Triage — bug or design gap?

**Do this before offering any design opinion.** A reported "design problem" is
often a rendering bug, and redesigning around a bug is wasted work. Two real
examples from this project:

- "Folding of lists doesn't work" → the collapse state only swapped a CSS class
  while the task list stayed mounted. A render bug, not a missing feature.
- "Columns stretch and I can't scroll the page" → a sibling header plus an
  `h-full` row inside an `overflow-y-hidden` box clipped content unreachably.
  A broken flex chain, not a layout philosophy problem.

State which it is, with evidence (`file:line`):

- **Bug** — the intended behaviour is already implemented but doesn't work. Fix
  the bug; a redesign is probably unnecessary.
- **Design gap** — behaviour works as built, but the built behaviour is wrong.
  Continue to Step 2.
- **Both** — say so, and separate them.

## Step 2: Compare against platform convention

Name what comparable tools do and why. Users arrive with expectations; matching
them is cheaper than teaching something new. For GSD's surfaces:

- **Board / columns** — Trello, Jira, Linear, GitHub Projects: board fixed to
  viewport, sticky column headers, each column scrolls independently, horizontal
  scroll for many columns.
- **Row actions** — always-visible controls beat hover-only when the action is
  frequent or the user is keyboard-driven; hover-only is acceptable for
  affordances that would add visual noise (e.g. a drag grip).
- **Destructive actions** — GSD has no undo, so a destructive action must be
  either trivially reversible by hand or clearly labelled.

If GSD deliberately departs from convention, say so explicitly rather than
silently breaking the expectation.

## Step 3: Honour the project stance

These are settled decisions. Do not propose changes that contradict them unless
the user is explicitly revisiting one:

- **Keyboard-first.** Arrow keys primary, `h/j/k/l` alternates, `?` for help.
- **No undo.** Tasks can be recreated; keep operations simple.
- **Hard delete.** No soft deletes or trash.
- **Errors:** disable controls at limits (never hide them); inline errors on
  failure; no toasts, no multi-step recovery flows.
- **Desktop primary.** Drag & drop is `lg+` only; mobile is a separate phase.
- **Single-user.** No collaboration, presence, or sharing affordances.

## Step 4: Recommend

Two or three sentences, not an essay. Include:

1. **The recommendation** — one clear choice, not a menu.
2. **The reason** — tie it to user consequence ("the header carries the list name
   and the `+` action, so losing it strands the user"), not to taste.
3. **The cheap alternative** — if a different reading is defensible, name it and
   the one-line change that would get there (e.g. "`items-start` instead of
   stretch gives Trello-style short columns"). This lets the user redirect
   without another round trip.

Flag any accessibility consequence (focus order, target size, contrast, screen
reader announcement) as part of the recommendation — not as an afterthought.

## Output Format

```markdown
## Triage
[Bug | Design gap | Both] — [evidence with file:line]

## What comparable tools do
[Convention and why it exists]

## Recommendation
[2-3 sentences: the choice + the user-facing reason]

## Cheaper alternative
[Other defensible reading + the one-line change] (omit if none)

## Accessibility note
[Focus / target size / contrast / announcement impact] (omit if none)
```

Keep it short enough to read in under a minute. If the answer is "this is a bug,
there is no design question here," say exactly that and stop.
