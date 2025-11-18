# AI Agent Validation Rules - Quick Reference

## TL;DR - Before Completing ANY Task

```bash
# Backend changes
cd apps/backend && pnpm lint && pnpm typecheck && pnpm build && pnpm test

# Frontend changes
cd apps/frontend && pnpm lint && pnpm typecheck && pnpm build

# Or use the validation script
./scripts/validate.sh backend
./scripts/validate.sh frontend
```

**If ANY check fails → Fix it → Re-run → Don't mark complete until ALL pass**

## Validation Checklist

- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Code is formatted (`pnpm format`)

## Common Error Fixes

### Lint Errors

```bash
# Auto-fix what can be fixed
pnpm lint:fix

# Then manually fix remaining issues
```

### Type Errors

- Check import paths
- Verify type definitions
- Ensure all required properties are present
- Never use `any` to bypass

### Build Errors

- Check for missing dependencies
- Verify file paths
- Check for syntax errors

### Test Failures

- Read failure message
- Determine: wrong implementation or outdated test?
- Fix accordingly

## Prohibited

❌ Completing with errors present
❌ Skipping validation steps
❌ Using `@ts-ignore` without fixing
❌ Using `eslint-disable` without justification

## Full Documentation

See `CLAUDE.md` section "AI Agent Validation Rules (CRITICAL)" for complete details.
