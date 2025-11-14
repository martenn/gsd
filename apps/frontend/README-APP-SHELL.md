# App Shell Implementation

This document describes the app shell implementation for GSD.

## Structure

```
src/
├── components/
│   ├── app-shell/
│   │   ├── AppShell.tsx        # Main container
│   │   ├── AppHeader.tsx       # Header with nav
│   │   ├── Logo.tsx            # Simple logo
│   │   ├── ModeButton.tsx      # Individual mode button
│   │   ├── ModeNavigation.tsx  # Mode switcher (Plan/Work/Done)
│   │   └── UserMenu.tsx        # User dropdown with logout
│   ├── views/
│   │   ├── PlanView.tsx        # Placeholder for Plan mode
│   │   ├── WorkView.tsx        # Placeholder for Work mode
│   │   └── DoneView.tsx        # Placeholder for Done view
│   └── App.tsx                 # Main app component with routing
├── hooks/
│   └── useAuth.ts              # Authentication hook
├── lib/
│   └── api/
│       ├── client.ts           # Fetch wrapper
│       └── auth.ts             # Auth API calls
├── providers/
│   └── QueryProvider.tsx       # TanStack Query provider
├── types/
│   └── app-shell.ts            # TypeScript types
└── pages/
    └── app/
        ├── index.astro         # Redirects to /app/plan
        ├── plan.astro          # Plan mode page
        ├── work.astro          # Work mode page
        └── done.astro          # Done mode page
```

## How It Works

1. **Authentication**
   - `useAuth` hook fetches user data on mount
   - Redirects to `/` if not authenticated
   - Shows loading spinner while checking

2. **Navigation**
   - Three modes: Plan, Work, Done
   - Click mode buttons to navigate
   - URL changes to `/app/{mode}`
   - Astro pages load the React app with correct view

3. **User Menu**
   - Shows user email with avatar
   - Click to open dropdown
   - Logout button clears session and redirects

## Running the App

1. Make sure backend is running on `http://localhost:3000`
2. Start frontend dev server:
   ```bash
   pnpm dev
   ```
3. Navigate to `/app` (will redirect to `/app/plan`)
4. Must be logged in first (via landing page)

## Next Steps

The placeholder views (Plan, Work, Done) need to be replaced with:
- Plan Mode: Full task and list management
- Work Mode: Focused task execution
- Done View: Completed tasks archive
