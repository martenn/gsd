---
description: End-to-end loop for a dogfooded GSD improvement or bug fix
---

# Improvement / Fix Loop

Your task is to take a problem reported from daily use of GSD and carry it through
to a reviewable PR. Optimised for the small-to-medium changes that dominate
post-MVP work, not for new features (use `featureplan` / `featureimpl` for those).

## Context

1. **Project rules and domain model:**
   @CLAUDE.md

2. **Validation rules (read Step 0 before running any check):**
   @.ai/standards/validation-workflow.md

3. **Code map — where things live:**
   @.ai/code-map.md

## Step 1: Locate

Find the real code before theorising. Cite `file:line`. Read the whole chain, not
just the component named in the report — layout and state bugs usually live in a
parent.

## Step 2: Diagnose the root cause

**Do not skip to the fix.** State the mechanism in one or two sentences, precise
enough that someone could predict the symptom from it.

If the report sounds like a design complaint, run the triage in `uxreview` first —
several "design problems" in this project turned out to be plain bugs.

## Step 3: UX review (mandatory for anything user-facing)

Apply the triage-and-recommendation structure in
@.claude/commands/uxreview.md (or invoke `/uxreview` if available) for **every**
change a user can see. Do this **before** implementing, so the design decision
drives the code rather than the reverse. Skip only for pure internals (build
config, non-visible refactors, tests); say so explicitly when you skip.

## Step 4: Fresh worktree from main

Every change gets its own worktree branched from **current main**:

- Never reuse a branch that has been merged — check with
  `git merge-base --is-ancestor <branch-head> main`.
- Never commit straight to `main`.
- Remove merged worktrees rather than letting them pile up.

## Step 5: Implement

Match the surrounding code's idiom, comment density, and naming. Keep the diff
scoped to the diagnosed cause — no opportunistic refactoring.

**Traps that have caused real production bugs here:**

- **`orderIndex` direction.** Tasks render **descending** (top = highest
  `orderIndex`); lists render **ascending**. Steps of 1000, midpoint splits on
  reorder. Getting the direction backwards silently inverts the list.
- **Repository argument order is not consistent.**
  `TasksRepository.findById(userId, taskId)` but
  `ListsRepository.findById(id, userId)` — opposite. Swapping them yields a
  confusing 404, not a type error. Always check the signature.
- **Decorated DTO properties need `import type`** for non-primitive types
  (`isolatedModules` + `emitDecoratorMetadata`), or `nest build` fails with
  TS1272.
- **Board column order** is `[...backlogs, ...intermediateLists]` with Done
  excluded. Anything computing "left"/"right"/"active" list must use this exact
  order or it will disagree with what the user sees.
- **Bounded flex chains.** For a scrollable region, every ancestor needs
  `min-h-0` plus `flex-1`. Never put an `h-full` child next to a sibling header
  inside an `overflow-hidden` box — the child overflows by the header's height
  and that overflow becomes unreachable.
- **DnD is desktop-only** (`lg+`, Mouse + Keyboard sensors, deliberately no
  `TouchSensor`). If you move which element owns `overflow`, dnd-kit's
  auto-scroll target changes — that needs a manual drag test.
- **Optimistic mutations** (`useMoveTask`, `useReorderTask`) follow
  onMutate snapshot → patch + re-sort → onError rollback → onSettled invalidate.
  Match that shape for any new mutation that moves a task.

## Step 6: Validate

Follow @.ai/standards/validation-workflow.md, **including Step 0**. In a new
worktree you must run `pnpm install && pnpm db:generate && pnpm build:packages`
before any lint or typecheck, or you will get hundreds of errors that have
nothing to do with your change.

Report results honestly. If something could not be run, say which and why —
never imply a check passed when it was skipped. Flag anything static analysis
cannot cover (drag behaviour, scroll behaviour, focus order) as needing a manual
check, and say what to try.

## Step 7: Ship

1. Commit — conventional commits; subject says what changed, body says **why**
   and what the mechanism was.
2. Push the branch and open a **draft** PR (`gh pr create --draft`).
3. Never push to `main`, never force-push, never merge.
4. If the item was on the list in `.ai/post-mvp-plan.md`, move it to the Done log
   with the date.
5. Update `.ai/code-map.md` if files were added, moved, or renamed.

## Output Format

```markdown
## Problem
[Symptom as reported]

## Root cause
[Mechanism, with file:line]

## UX decision
[Recommendation + reason — or why no UX review was needed]

## Change
- `path/to/file.tsx` — [what and why]

## Validation
- Step 0: [ran / already present]
- lint / typecheck / build / test: [results, or which were skipped and why]
- Manual check needed: [what to try] (omit if none)
```
