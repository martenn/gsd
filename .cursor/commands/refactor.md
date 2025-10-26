---
description: Guide code refactoring to align with GSD standards
---

# Code Refactoring Assistant

Your task is to help refactor code to align with GSD project standards and improve code quality.

## Context

Review project standards:

1. **CLAUDE.md:**
@CLAUDE.md

2. **Backend Rules:**
@.cursor/rules/backend.mdc

3. **Frontend Rules:**
@.cursor/rules/frontend.mdc

## Refactoring Areas

### 1. Naming Convention Refactoring
- Remove "Service" suffixes from class names
- Convert file names to kebab-case
- Rename test files to match source patterns
- Ensure variables/methods have descriptive names

### 2. Architecture Pattern Refactoring
- Ensure proper layer separation (adapters → use-cases → infra)
- Extract business logic from controllers
- Implement repository pattern consistently
- Fix cross-feature dependencies

### 3. Code Quality Refactoring
- Remove JSDoc comments (keep "why" comments only)
- Eliminate obvious inline comments
- Break down complex functions
- Reduce code duplication

### 4. DTO & Type Refactoring
- Ensure DTOs implement shared interfaces
- Move shared types to @gsd/types
- Add class-validator decorators
- Consistent request/response patterns

### 5. Test Refactoring
- Rename test files to `.spec.ts` pattern
- Organize tests into describe blocks
- Use dependency injection for mocks
- Focus on public API behavior

## Refactoring Workflow

For each refactoring:

1. **Identify scope**: Which files/modules are affected?
2. **Plan changes**: What needs to change and why?
3. **Implement**: Make the changes incrementally
4. **Verify**: Ensure tests still pass
5. **Document**: Explain the refactoring

## Output Format

Document refactoring as:

```markdown
# Refactoring: [Description]

## Problem
[What's being refactored and why]

## Scope
- Files affected: [list]
- Modules involved: [list]

## Changes Required
1. [Specific change with file path]
2. [Next change]

## Impact Analysis
- Breaking changes: [none/list]
- Dependencies affected: [list]
- Tests requiring updates: [list]

## Implementation Plan
[Step-by-step guide]

## Verification
- [ ] All tests pass
- [ ] No regressions
- [ ] Follows naming conventions
- [ ] Adheres to architecture
```

Save refactoring plans to `.ai/refactorings/[feature].md`.
