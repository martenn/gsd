# Frontend Development Standards

> Detailed React, Astro, and frontend coding standards for the GSD project.
> Referenced from main [CLAUDE.md](../../CLAUDE.md)

## Support Level: BEGINNER-FRIENDLY

- Keep code in small, understandable chunks (prefer multiple simple components over one complex component)
- Always favor simpler solutions over clever or optimized ones
- Omit nice-to-have features; implement only what's strictly necessary for MVP
- When in doubt, ask for clarification before implementing
- Document unclear decisions in a tracker file for future discussion

## Component Size

- Maximum 50-80 lines per component (excluding types)
- If a component grows larger, split it into smaller components
- Each component should have a single, clear responsibility

## File Structure

- One component per file (no multiple exports)
- Keep related files together in feature folders
- Use clear, descriptive file names matching component names

## Naming Conventions

- Components: PascalCase (e.g., `TaskCard.tsx`)
- Files: Match component name (e.g., `TaskCard.tsx` for `TaskCard` component)
- Hooks: `use` prefix (e.g., `useTaskList.ts`)
- Types: `types.ts` suffix for separate type files

## React Coding Standards

- Use functional components with hooks instead of class components
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Use the new use hook for data fetching in React 19+ projects
- Leverage Server Components for data-fetching-heavy components when using React with Next.js or similar frameworks
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

## Component Patterns

- Use functional components only (no class components)
- Use TypeScript interfaces for props (defined at top of file)
- Keep useState and useEffect at the top of components
- Extract complex logic into custom hooks

## State Management

- Start with local useState for UI state
- Use TanStack Query only for server data
- Avoid premature optimization with context or complex state

## Props

- Keep props simple and flat (avoid nested objects when possible)
- Use explicit prop types (no `any` or overly complex unions)
- Provide default values for optional props

## Tailwind CSS Best Practices

- Use the @layer directive to organize styles into components, utilities, and base layers
- Implement Just-in-Time (JIT) mode for development efficiency and smaller CSS bundles
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Leverage the @apply directive in component classes to reuse utility combinations
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Use component extraction for repeated UI patterns instead of copying utility classes
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus:, active:, etc.) for interactive elements

## Styling

- Use utility classes directly in JSX (no @apply in MVP)
- Keep class lists readable (use clsx or cn helper for conditional classes)
- Use shadcn/ui components as-is (no customization in MVP)

## Avoid Premature Styling

- Focus on functionality first, polish later
- Use basic Tailwind spacing and colors initially
- Don't spend time on animations or transitions in MVP

## Astro Coding Standards

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed
- Leverage View Transitions API for smooth page transitions
- Use content collections with type safety for blog posts, documentation, etc.
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Leverage Server Endpoints for API routes
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables

## Error Handling

- Use try-catch for async operations
- Display simple error messages (no toast libraries in MVP)
- Log errors to console for debugging
- Don't implement complex error recovery in MVP

## Accessibility (ARIA) Standards

- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set aria-expanded and aria-controls for expandable content like accordions and dropdowns
- Use aria-live regions with appropriate politeness settings for dynamic content updates
- Implement aria-hidden to hide decorative or duplicative content from screen readers
- Apply aria-label or aria-labelledby for elements without visible text labels
- Use aria-describedby to associate descriptive text with form inputs or complex elements
- Implement aria-current for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements
- Apply aria-invalid and appropriate error messaging for form validation

## Testing (Post-MVP)

- Manual testing in browser is sufficient for MVP
- Focus on functionality over test coverage
- Add tests after MVP is working

## When to Ask for Help

Always ask before:
- Implementing a feature that seems too complex
- Adding a new library or dependency
- Deviating from existing patterns
- Making architectural decisions

## MVP Feature Omissions

The following can be omitted or simplified for MVP:

- Loading skeletons (use simple spinner)
- Optimistic updates (update after server confirms)
- Complex animations
- Advanced keyboard navigation (implement basic first)
- Accessibility beyond semantic HTML and ARIA basics
