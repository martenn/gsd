# Code Review Against Project Standards

Your task is to review code changes for adherence to project guidelines, style guides, and best practices.

## Review Context

Review the following standards:

1. **CLAUDE.md Guidelines:**
@CLAUDE.md

2. **Backend Rules:**
@.cursor/rules/backend.mdc

3. **Frontend Rules:**
@.cursor/rules/frontend.mdc

## Review Checklist

### Naming & Structure
- [ ] Classes follow naming conventions (no "Service" suffix)
- [ ] Files use kebab-case naming
- [ ] Test files mirror source files with `.spec.ts` suffix
- [ ] Feature folders are properly organized

### Architecture
- [ ] Repository pattern correctly implemented
- [ ] Use cases have single `execute()` method
- [ ] Controllers only delegate, no business logic
- [ ] DTOs properly implement shared interfaces
- [ ] No circular dependencies between features

### Code Quality
- [ ] No `any` types used without justification
- [ ] Comments focus on "why" not "what"
- [ ] No JSDoc unless specifically requested
- [ ] Well-named functions and variables are self-documenting
- [ ] Avoid obvious inline comments

### Testing
- [ ] Tests mirror source file names
- [ ] Tests describe expected behavior
- [ ] Tests use dependency injection for mocks
- [ ] Public API tested, not internal implementation
- [ ] Focused, atomic test cases

### TypeScript/NestJS
- [ ] Dependency injection properly used
- [ ] Custom decorators for cross-cutting concerns
- [ ] Guards for authorization
- [ ] Interceptors for response transformation
- [ ] Prisma with repository patterns

### Frontend (React/Astro)
- [ ] Functional components with hooks
- [ ] React.memo for expensive components
- [ ] useCallback for event handlers
- [ ] useMemo for expensive calculations
- [ ] Proper ARIA attributes for accessibility

### Security
- [ ] No hardcoded secrets
- [ ] Input validation on all endpoints
- [ ] Proper error handling without leaking info
- [ ] CORS and rate limiting configured

## Output Format

Provide review as:

```markdown
# Code Review Report

## Summary
[Overview of findings]

## Issues Found
### Critical
[Issues blocking merge]

### Major
[Issues requiring changes]

### Minor
[Suggestions for improvement]

## Positive Notes
[What was done well]

## Recommendations
[Priority-ordered suggestions]
```

Note: If reviewing recent changes, use `git diff` to identify what was changed.
