# AI Agent Validation Rules (CRITICAL)

> **MANDATORY: All AI agents (Cursor, Claude Code, etc.) MUST follow these rules before completing any code changes.**
> Referenced from main [CLAUDE.md](../../CLAUDE.md)

## Pre-Completion Validation Checklist

**BEFORE marking any task as complete, AI agents MUST:**

### 1. Run Linting

- Backend: `cd apps/backend && pnpm lint`
- Frontend: `cd apps/frontend && pnpm lint`
- Root packages: `cd packages/types && pnpm lint` (if applicable)
- **MUST FIX ALL LINT ERRORS** before proceeding
- If lint errors exist, run `pnpm lint:fix` and manually fix remaining issues

### 2. Run Type Checking

- Backend: `cd apps/backend && pnpm typecheck`
- Frontend: `cd apps/frontend && pnpm typecheck`
- **MUST FIX ALL TYPE ERRORS** before proceeding
- Type errors are blocking issues - code with type errors is incomplete

### 3. Run Build

- Backend: `cd apps/backend && pnpm build`
- Frontend: `cd apps/frontend && pnpm build`
- **MUST FIX ALL BUILD ERRORS** before proceeding
- Build failures indicate incomplete or incorrect code

### 4. Run Tests

- Backend: `cd apps/backend && pnpm test`
- Backend E2E: `cd apps/backend && pnpm test:e2e` (if applicable)
- **MUST FIX ALL TEST FAILURES** before proceeding
- If tests fail due to code changes, update tests or fix implementation
- If tests fail due to missing test updates, add/update tests accordingly

### 5. Format Code

- Run `pnpm format` at root level or per package
- Ensure consistent formatting across all changed files

## Validation Workflow

**For every code change set:**

```
1. Make code changes
2. Run lint → Fix errors → Re-run lint until clean
3. Run typecheck → Fix errors → Re-run typecheck until clean
4. Run build → Fix errors → Re-run build until successful
5. Run tests → Fix failures → Re-run tests until passing
6. Run format → Ensure consistent formatting
7. Verify no new errors introduced
8. Only then mark task as complete
```

## Error Handling Rules

### When encountering errors:

#### 1. Lint Errors

- Read error messages carefully
- Fix formatting issues automatically with `lint:fix`
- Fix code quality issues manually
- Never ignore lint errors with `eslint-disable` unless absolutely necessary and documented

#### 2. Type Errors

- Read TypeScript error messages
- Fix type mismatches, missing types, or incorrect type usage
- Never use `any` to bypass type errors (unless explicitly allowed in project rules)
- Ensure all imports are correctly typed

#### 3. Build Errors

- Check for missing dependencies
- Verify import paths are correct
- Check for syntax errors
- Ensure all required files are present

#### 4. Test Failures

- Read test failure messages
- Determine if implementation is wrong or test needs updating
- Fix implementation if behavior changed incorrectly
- Update tests if behavior changed intentionally
- Ensure all new code paths are tested

## Prohibited Practices

**NEVER:**

- Mark a task complete with lint errors present
- Mark a task complete with type errors present
- Mark a task complete with build failures
- Mark a task complete with failing tests
- Skip validation steps to save time
- Use `@ts-ignore` or `@ts-expect-error` without fixing underlying issues
- Use `eslint-disable` without justification
- Commit code that doesn't pass all checks

## Required Tools Usage

**Always use these commands in the correct order:**

```bash
# Backend validation sequence
cd apps/backend
pnpm lint          # Must pass
pnpm typecheck     # Must pass
pnpm build         # Must pass
pnpm test          # Must pass

# Frontend validation sequence
cd apps/frontend
pnpm lint          # Must pass
pnpm typecheck     # Must pass
pnpm build         # Must pass

# Root-level validation (if making cross-package changes)
pnpm lint          # Must pass
pnpm typecheck     # Must pass
pnpm build         # Must pass
pnpm test          # Must pass
```

## Exception Handling

**Only in these cases can validation be skipped:**

### 1. Work-in-Progress (WIP) commits

- Must be explicitly marked as WIP
- Must include `[WIP]` prefix in commit message
- Must be followed by completion commit that passes all checks

### 2. Breaking changes requiring coordination

- Must be documented in PR description
- Must include migration plan
- Must be approved before merging

### 3. Known issues documented

- Must be tracked in issue tracker
- Must have timeline for resolution
- Must not block other development

## Verification Commands

**Before completing any task, run this verification:**

```bash
# Quick validation script (create if needed)
# Should return exit code 0 if all checks pass

# Backend
cd apps/backend && \
  pnpm lint && \
  pnpm typecheck && \
  pnpm build && \
  pnpm test

# Frontend
cd apps/frontend && \
  pnpm lint && \
  pnpm typecheck && \
  pnpm build

# If any command fails, fix issues and re-run
```

## Integration with Git Workflow

**Before committing or marking complete:**

1. Stage all changes
2. Run full validation suite
3. If validation passes → proceed with commit/complete
4. If validation fails → fix issues and repeat from step 2

## Reporting Validation Status

**When completing a task, AI agents MUST report:**

```
✅ Linting: PASSED
✅ Type Checking: PASSED
✅ Build: PASSED
✅ Tests: PASSED
✅ Formatting: APPLIED

Task complete - all validations passed.
```

**If any check fails, report:**

```
❌ Linting: FAILED (X errors)
❌ Type Checking: FAILED (Y errors)
⚠️  Fixing issues...

[After fixes]
✅ All validations now pass.
```

## Continuous Validation

**During development:**

- Run linting frequently (after each file change)
- Run typecheck after significant changes
- Run tests after logic changes
- Don't wait until the end to validate

**This prevents:**

- Accumulation of errors
- Difficult-to-debug issues
- Time-consuming fixes at the end

---

**REMINDER: Code that doesn't pass all validation checks is incomplete code. Incomplete code should never be marked as complete.**
