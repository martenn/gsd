---
description: Synchronize CLAUDE.md with .cursor/rules/ guidelines
---

# Synchronize CLAUDE.md with .cursor/rules/

Your task is to ensure CLAUDE.md and .cursor/rules/\*.mdc files stay in sync, following the meta-rule at the top of CLAUDE.md:

**When architectural patterns, coding standards, or rules are established or changed during a conversation:**

1. Always update CLAUDE.md with the new rule/pattern
2. Always update the corresponding `.cursor/rules/*.mdc` file(s)
3. Both files must stay in sync
4. Changes should be made in the same response/action

## Review Process

Before syncing, analyze:

1. What rules exist in CLAUDE.md but not in `.cursor/rules/`?
2. What rules exist in `.cursor/rules/` but not in CLAUDE.md?
3. What differences exist between the two versions?

## Sync Strategy

- **CLAUDE.md is the source of truth** for the complete, detailed guidelines
- `.cursor/rules/*.mdc` files are derived from CLAUDE.md and should mirror the relevant sections
- Both must be updated simultaneously when changes are made

## Files to Check

- CLAUDE.md (main guidelines document)
- .cursor/rules/backend.mdc (backend-specific rules)
- .cursor/rules/frontend.mdc (frontend-specific rules)

## Output

After syncing, create a git commit with:

- Message: `docs: synchronize CLAUDE.md with .cursor/rules/ guidelines`
- Include a summary of what was synced and any discrepancies found
