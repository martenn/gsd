# Test Strategy & Coverage Analysis

Your task is to develop comprehensive testing strategies and analyze test coverage for GSD.

## Context

Review the following first:

1. **Project Structure:**
@CLAUDE.md

2. **Backend Rules & Testing Conventions:**
@.cursor/rules/backend.mdc

3. **Development Workflow:**
@CLAUDE.md

## Testing Scope

### 1. Current Test Coverage Analysis
- Identify what's being tested
- Identify gaps in coverage
- Assess test quality and organization
- Review test file naming and structure

### 2. Unit Test Strategy
For each module/service, determine:
- What should be tested (public API, not internals)
- How to structure tests (describe blocks by behavior)
- Mocking strategy (dependency injection)
- Edge cases and error scenarios

### 3. Integration Test Strategy
- Test interactions between layers (adapter → use-case → repository)
- Test DTO validation and transformation
- Test error propagation

### 4. E2E Test Strategy
- API endpoint coverage
- Authentication flows
- Error scenarios with proper status codes
- Business logic constraints

### 5. Test Patterns & Examples
Based on existing tests:
- Identify patterns used in the codebase
- Extract reusable test utilities
- Document best practices with examples

## Testing Conventions

Follow these standards:
- Test files: `{feature}.spec.ts` naming
- Describe blocks: group related tests by behavior
- Test names: describe expected behavior
- Mocking: use dependency injection
- Assertions: test public API behavior
- Organization: atomic, focused tests

## Output Format

Provide test strategy as:

```markdown
# Test Strategy for [Feature/Module]

## Module Overview
[What this module does]

## Test Coverage Gaps
[What's missing tests]

## Unit Test Plan
### [Service/Function Name]
- Test cases:
  1. [Happy path]
  2. [Error scenario]
  3. [Edge case]

## Integration Test Plan
[How modules interact]

## Implementation Examples
[Code examples following project patterns]

## Coverage Targets
- Line coverage: X%
- Branch coverage: Y%
- Behavior coverage: [specific scenarios]
```

Save strategies to `.ai/test-strategies/[feature].md` for reference.

## Commands for Test Execution

- Run all tests: `pnpm test`
- Run specific test: `pnpm test -- --testPathPattern="pattern"`
- Run with coverage: `pnpm test -- --coverage`
- Backend tests: `pnpm --filter @gsd/backend test`
