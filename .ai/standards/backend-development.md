# Backend Development Standards

> Detailed TypeScript, NestJS, and backend coding standards for the GSD project.
> Referenced from main [CLAUDE.md](../../CLAUDE.md)

## Support Level: EXPERT

- Favor elegant, maintainable solutions with verbose code. Assume understanding of language idioms and design patterns.
- Highlight potential performance implications and optimization opportunities in suggested code.
- Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.
- Focus comments on 'why' not 'what' - assume code readability through well-named functions and variables.
- Proactively address edge cases, race conditions, and security considerations without being prompted.
- When debugging, provide targeted diagnostic approaches rather than shotgun solutions.
- Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.

## TypeScript Best Practices

- Avoid using `any` type - prefer explicit types or generics
- Use strict mode in TypeScript configuration

## Code Documentation

- Don't use JSDoc or similar documentation comments, unless specifically requested
- Avoid inline comments that state the obvious (e.g., `// Blue` next to color codes)
- Let well-named functions and variables be self-documenting
- Focus on "why" not "what" when comments are necessary

## Naming Conventions

### Class Names

- Avoid "Service" suffix in class names - use descriptive names instead
  - Examples: `ColorPool` instead of `ColorPoolService`, `ScanUsedColors` instead of `ColorScanService`
  - Class names should clearly indicate their primary responsibility
  - Use descriptive method names that explain intent

### File Naming

- Match file names to class names: `color-pool.ts` for `ColorPool` class
- Use kebab-case for file names: `scan-used-colors.ts` not `scanUsedColors.ts`
- Test files should mirror source files: `color-pool.spec.ts` for `color-pool.ts`

## NestJS Best Practices

- Use dependency injection for services to improve testability and maintainability following SOLID principles
- Implement custom decorators for cross-cutting concerns to keep code DRY and maintain separation of business logic
- Use interceptors for transforming the response data structure consistently
- Leverage NestJS Guards for authorization to centralize access control logic across all resources
- Implement domain-driven design with modules that encapsulate related functionality and maintain clear boundaries
- Use Prisma with repository patterns to abstract database operations and simplify testing with mocks

## Logging Standards

**Use `AppLogger` throughout the application:**

- Use `AppLogger` (from `src/logger/app-logger.ts`) for all logging throughout the application
- Inject `AppLogger` via dependency injection in use cases, services, and other classes
- Always call `setContext()` in the constructor to set the class name as context

**Log Levels:**

- `log()` - General information about operations (e.g., "Creating list for user X")
- `error()` - Errors with stack traces (always include error message and stack)
- `warn()` - Warning conditions
- `debug()` - Detailed debugging information (request bodies, etc.)
- `verbose()` - Very detailed diagnostic information

**Best Practices:**

- Wrap use case `execute()` methods in try-catch blocks:
  - Log at the start of execution with key parameters
  - Log success at the end with created resource IDs
  - Log errors with full context before re-throwing
- HTTP requests/responses are automatically logged by `HttpLoggingInterceptor`
- In tests, mock `AppLogger` with all methods (log, error, warn, debug, verbose, setContext)
- Log configuration is environment-aware (more verbose in development, production logs only error/warn/log)

## Testing Conventions

**General Principles:**

- Test files should mirror source file names: `{feature}.spec.ts`
- Use descriptive test descriptions that explain behavior
- Group related tests in describe blocks
- Test the public API, not internal implementation
- Use meaningful test names that describe expected behavior
- Keep tests focused and atomic
- Use dependency injection to mock external dependencies

**Focus on Business Logic, Not Structure:**

Tests should verify behavior and logic, not compilation-level guarantees:

- ❌ Don't test method existence: `expect(instance.method).toBeDefined()` - TypeScript verifies this
- ❌ Don't test type checks: `expect(result).toBeInstanceOf(Class)` - TypeScript verifies this
- ❌ Don't test property existence: `expect(result.property).toBeDefined()` - TypeScript verifies this
- ❌ Don't test function type: `expect(typeof fn).toBe('function')` - TypeScript verifies this
- ✅ Do test return values, business rules, error conditions, state changes, side effects
- Example: Instead of testing if a color is defined, test that it matches the expected format or value

## Docker Best Practices

- Use multi-stage builds to create smaller production images
- Use non-root users in containers for better security
