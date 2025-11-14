# View Implementation Plan: App Shell

## 1. Overview

The App Shell is the authenticated React SPA container mounted at `/app/*` that serves as the primary interface for the GSD productivity application. It provides the frame for all authenticated views (Plan Mode, Work Mode, Done View) with consistent navigation, keyboard shortcuts, and user session management. The shell implements a minimal, keyboard-first design with global shortcuts, a command palette, and persistent session state.

## 2. View Routing

The app shell is mounted at the following routes:
- `/app` (redirects to `/app/plan`)
- `/app/plan` - Plan Mode (full task and list management)
- `/app/work` - Work Mode (focused execution)
- `/app/done` - Done Archive (completed tasks)

**Implementation Approach:**
- Astro page at `apps/frontend/src/pages/app/[...slug].astro` that mounts the React app
- Astro middleware validates JWT cookie and redirects unauthenticated users to landing page
- React Router (or similar) handles client-side routing within `/app/*`
- Default redirect from `/app` to `/app/plan`

## 3. Component Structure

```
<AppShell>
  ├── <AppHeader>
  │   ├── <Logo>
  │   ├── <ModeNavigation>
  │   │   ├── <ModeButton mode="plan">
  │   │   ├── <ModeButton mode="work">
  │   │   └── <ModeButton mode="done">
  │   └── <UserMenu>
  │       ├── <UserAvatar>
  │       └── <DropdownMenu>
  │           ├── <MenuItem action="keyboard-help">
  │           ├── <MenuItem action="settings">
  │           └── <MenuItem action="logout">
  ├── <MainContent>
  │   └── <Outlet /> // Plan, Work, or Done view
  ├── <KeyboardShortcutsHelp modal> (triggered by "?")
  ├── <CommandPalette modal> (triggered by Cmd+K)
  └── <GlobalKeyboardHandler>
```

## 4. Component Details

### AppShell
- **Component description:** Root container for the authenticated application providing layout structure, global keyboard handling, and modal management. Wraps all authenticated views and manages global application state.
- **Main elements:**
  - `<div className="h-screen flex flex-col">` - Full height container
  - `<AppHeader>` - Fixed header with navigation
  - `<main>` - Flexible main content area
  - Conditional modals for help overlay and command palette
- **Handled interactions:**
  - `?` keypress → Open keyboard shortcuts help overlay
  - `Cmd+K` or `Ctrl+K` → Open command palette
  - `Cmd+P` → Navigate to Plan Mode
  - `Cmd+W` → Navigate to Work Mode (with preventDefault to avoid closing window)
  - `Cmd+D` → Navigate to Done View
  - `Esc` → Close any open modals
- **Validation conditions:** None (layout component)
- **Types:**
  - `AppShellProps` (component props)
  - `UserDto` (from @gsd/types for user context)
- **Props:**
  ```typescript
  interface AppShellProps {
    children?: React.ReactNode;
  }
  ```

### AppHeader
- **Component description:** Fixed header displaying logo, mode navigation, and user menu. Provides consistent navigation across all authenticated views.
- **Main elements:**
  - `<header>` with fixed positioning
  - `<Logo>` component (left)
  - `<ModeNavigation>` component (center)
  - `<UserMenu>` component (right)
- **Handled interactions:**
  - None directly (delegates to child components)
- **Validation conditions:** None
- **Types:**
  - `AppHeaderProps`
  - `UserDto` (from @gsd/types)
- **Props:**
  ```typescript
  interface AppHeaderProps {
    currentMode: 'plan' | 'work' | 'done';
    user: UserDto;
  }
  ```

### ModeNavigation
- **Component description:** Horizontal navigation showing three mode buttons (Plan, Work, Done) with active state indication. Primary navigation mechanism for switching between views.
- **Main elements:**
  - `<nav>` with flex layout
  - Three `<ModeButton>` components
- **Handled interactions:**
  - Click on mode button → Navigate to corresponding view
- **Validation conditions:** None
- **Types:**
  - `ModeNavigationProps`
  - `Mode = 'plan' | 'work' | 'done'`
- **Props:**
  ```typescript
  interface ModeNavigationProps {
    currentMode: Mode;
    onModeChange: (mode: Mode) => void;
  }
  ```

### ModeButton
- **Component description:** Individual navigation button for each mode with active/inactive states, keyboard shortcuts hint, and accessible labeling.
- **Main elements:**
  - `<button>` with conditional styling based on active state
  - Icon (optional, from lucide-react)
  - Text label
  - Keyboard shortcut hint (subtle, right-aligned)
- **Handled interactions:**
  - Click → Trigger `onModeChange` callback
- **Validation conditions:** None
- **Types:**
  - `ModeButtonProps`
  - `Mode = 'plan' | 'work' | 'done'`
- **Props:**
  ```typescript
  interface ModeButtonProps {
    mode: Mode;
    isActive: boolean;
    onClick: () => void;
  }
  ```

### UserMenu
- **Component description:** Dropdown menu in the header providing user info display, keyboard help access, and logout functionality.
- **Main elements:**
  - `<DropdownMenu>` from shadcn/ui
  - `<DropdownMenuTrigger>` with user avatar/name
  - `<DropdownMenuContent>` with menu items
- **Handled interactions:**
  - Click avatar → Open dropdown
  - Click "Keyboard Shortcuts" → Open help overlay
  - Click "Logout" → Call logout API and redirect
- **Validation conditions:** None
- **Types:**
  - `UserMenuProps`
  - `UserDto` (from @gsd/types)
- **Props:**
  ```typescript
  interface UserMenuProps {
    user: UserDto;
    onLogout: () => void;
    onOpenKeyboardHelp: () => void;
  }
  ```

### KeyboardShortcutsHelp
- **Component description:** Modal overlay displaying categorized keyboard shortcuts with search/filter functionality. Opened by pressing "?" from anywhere in the app.
- **Main elements:**
  - `<Dialog>` from shadcn/ui
  - `<DialogContent>` with search input
  - Categorized sections: Global, Plan Mode, Work Mode
  - `<Input>` for search/filter
  - Shortcut list with key visual and description
- **Handled interactions:**
  - `Esc` or close button → Close modal
  - Type in search → Filter shortcuts
- **Validation conditions:** None
- **Types:**
  - `KeyboardShortcutsHelpProps`
  - `KeyboardShortcut` (internal type for shortcut definitions)
- **Props:**
  ```typescript
  interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
  }

  interface KeyboardShortcut {
    category: 'global' | 'plan' | 'work';
    keys: string[]; // e.g., ['Cmd', 'P']
    description: string;
    action: string; // e.g., 'Switch to Plan Mode'
  }
  ```

### CommandPalette
- **Component description:** Global command palette (Cmd+K) providing searchable access to all major actions and navigation. Improves discoverability and accessibility for mouse users.
- **Main elements:**
  - `<Command>` component from shadcn/ui (cmdk)
  - `<CommandInput>` for search
  - `<CommandList>` with grouped items
  - `<CommandGroup>` for categorization (Navigation, Actions, Help)
  - `<CommandItem>` for each command
- **Handled interactions:**
  - `Cmd+K` or `Ctrl+K` → Open palette
  - `Esc` → Close palette
  - Arrow keys → Navigate items
  - `Enter` → Execute selected command
- **Validation conditions:** None
- **Types:**
  - `CommandPaletteProps`
  - `CommandItem` (internal type)
- **Props:**
  ```typescript
  interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
  }

  interface CommandItem {
    id: string;
    label: string;
    category: 'navigation' | 'actions' | 'help';
    shortcut?: string[];
    action: () => void;
  }
  ```

### GlobalKeyboardHandler
- **Component description:** Invisible component that listens for global keyboard events and dispatches appropriate actions. Manages keyboard event priority and prevents conflicts.
- **Main elements:**
  - React component with useEffect for event listener registration
  - No visual elements (returns null)
- **Handled interactions:**
  - All global keyboard shortcuts (mode switching, help, command palette)
  - Delegates to appropriate handlers based on key combination
  - Prevents default browser behavior for app shortcuts
- **Validation conditions:** None
- **Types:**
  - `GlobalKeyboardHandlerProps`
  - `KeyboardEvent` (native DOM type)
- **Props:**
  ```typescript
  interface GlobalKeyboardHandlerProps {
    onOpenHelp: () => void;
    onOpenCommandPalette: () => void;
    onNavigate: (mode: Mode) => void;
  }
  ```

## 5. Types

### Core Types (Shared from @gsd/types)

```typescript
// From @gsd/types/api/auth.ts
export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMeResponseDto {
  user: UserDto;
}

export interface SignOutResponseDto {
  message: string;
}
```

### View-Specific Types (apps/frontend/src/types/app-shell.ts)

```typescript
// Mode enum
export type Mode = 'plan' | 'work' | 'done';

// App Shell Props
export interface AppShellProps {
  children?: React.ReactNode;
}

// Header Props
export interface AppHeaderProps {
  currentMode: Mode;
  user: UserDto;
}

// Mode Navigation Props
export interface ModeNavigationProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export interface ModeButtonProps {
  mode: Mode;
  isActive: boolean;
  onClick: () => void;
}

// User Menu Props
export interface UserMenuProps {
  user: UserDto;
  onLogout: () => void;
  onOpenKeyboardHelp: () => void;
}

// Keyboard Shortcuts Help Props
export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface KeyboardShortcut {
  id: string;
  category: 'global' | 'plan' | 'work';
  keys: string[]; // Array of key names, e.g., ['Cmd', 'P']
  description: string;
  action: string;
}

// Command Palette Props
export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CommandItem {
  id: string;
  label: string;
  category: 'navigation' | 'actions' | 'help';
  shortcut?: string[];
  icon?: React.ComponentType;
  action: () => void;
}

// Global Keyboard Handler Props
export interface GlobalKeyboardHandlerProps {
  onOpenHelp: () => void;
  onOpenCommandPalette: () => void;
  onNavigate: (mode: Mode) => void;
}

// Router types (if using React Router)
export interface RouteConfig {
  path: string;
  element: React.ReactElement;
}
```

## 6. State Management

### Authentication State
- **Hook:** `useAuth()` (custom hook)
- **Location:** `apps/frontend/src/hooks/use-auth.ts`
- **Responsibilities:**
  - Fetch current user on app mount via `GET /auth/me`
  - Cache user data in TanStack Query
  - Provide logout function that calls `POST /auth/logout` and invalidates cache
  - Redirect to landing page if user is not authenticated
- **Implementation:**
  ```typescript
  export function useAuth() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: user, isLoading, error } = useQuery({
      queryKey: ['auth', 'me'],
      queryFn: () => getMe(), // API call
      retry: false,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const logoutMutation = useMutation({
      mutationFn: () => logout(), // API call
      onSuccess: () => {
        queryClient.clear(); // Clear all cache
        navigate('/'); // Redirect to landing
      },
    });

    return {
      user: user?.user ?? null,
      isLoading,
      isAuthenticated: !!user,
      logout: logoutMutation.mutate,
    };
  }
  ```

### Modal State
- **Type:** Local component state (useState)
- **Location:** `AppShell` component
- **State Variables:**
  - `isHelpOpen: boolean` - Controls keyboard shortcuts help overlay
  - `isCommandPaletteOpen: boolean` - Controls command palette modal
- **State Updates:**
  - Set by keyboard shortcuts and user actions
  - Reset by modal close callbacks

### Navigation State
- **Type:** React Router (or similar) state
- **Location:** URL parameter/path
- **Current Mode:** Derived from current route (`/app/plan`, `/app/work`, `/app/done`)
- **Persistence:** URL serves as source of truth, no additional state needed

### Session Persistence (Post-MVP)
- **Scope:** Deferred to post-MVP
- **Future Implementation:** localStorage for "last visited mode" to restore on app load

## 7. API Integration

### Authentication APIs

**Get Current User:**
- **Endpoint:** `GET /auth/me`
- **Request Type:** None (no body)
- **Response Type:** `GetMeResponseDto`
- **Usage:** Called on app mount to verify session and fetch user data
- **Error Handling:** 401 redirects to landing page

**Logout:**
- **Endpoint:** `POST /auth/logout`
- **Request Type:** None (no body)
- **Response Type:** `SignOutResponseDto`
- **Usage:** Called when user clicks "Logout" in user menu
- **Success Action:** Clear all TanStack Query cache and redirect to landing page

### API Client Implementation

**Location:** `apps/frontend/src/lib/api/auth.ts`

```typescript
import { GetMeResponseDto, SignOutResponseDto } from '@gsd/types';
import { apiClient } from './client';

export async function getMe(): Promise<GetMeResponseDto> {
  const response = await apiClient.get('/auth/me');
  return response.json();
}

export async function logout(): Promise<SignOutResponseDto> {
  const response = await apiClient.post('/auth/logout');
  return response.json();
}
```

**Base Client:** `apps/frontend/src/lib/api/client.ts`
- Wraps native fetch with error handling
- Automatically includes credentials (JWT cookie)
- Handles common error responses (401, 500)

## 8. User Interactions

### Mode Switching
1. User clicks a mode button (Plan, Work, Done) in the header
2. Or user presses keyboard shortcut (`Cmd+P`, `Cmd+W`, `Cmd+D`)
3. Navigation handler calls `navigate()` with target route
4. React Router updates URL and renders corresponding view
5. Active mode indicator updates in header

### Opening Keyboard Help
1. User presses `?` from anywhere in the app
2. GlobalKeyboardHandler detects keypress
3. Calls `setIsHelpOpen(true)` to show modal
4. Modal renders with categorized shortcuts and search
5. User can filter by typing in search input
6. User closes with `Esc` or close button

### Opening Command Palette
1. User presses `Cmd+K` (or `Ctrl+K` on Windows/Linux)
2. GlobalKeyboardHandler detects keypress
3. Calls `setIsCommandPaletteOpen(true)` to show modal
4. Modal renders with searchable command list
5. User types to filter commands or navigates with arrow keys
6. User executes command with `Enter`
7. Modal closes and command executes

### Logout Flow
1. User clicks avatar in header to open user menu dropdown
2. User clicks "Logout" menu item
3. Logout mutation calls `POST /auth/logout`
4. On success, clears all TanStack Query cache
5. Redirects user to landing page (`/`)
6. Backend clears JWT cookie

### Keyboard Shortcut Handling
- All global shortcuts are captured by GlobalKeyboardHandler
- Mode-specific shortcuts are handled by child components (Plan, Work, Done)
- Conflicts resolved by event priority (modals capture events first)
- `preventDefault()` called on handled shortcuts to prevent browser defaults

## 9. Conditions and Validation

### Authentication Validation
- **Condition:** User must be authenticated to access `/app/*`
- **Components Affected:** AppShell (all)
- **Validation Method:** Astro middleware checks JWT cookie before rendering
- **Interface Effect:** Unauthenticated users redirected to `/` (landing page)

### User Data Loading State
- **Condition:** User data must be loaded before rendering UI
- **Components Affected:** AppShell, AppHeader, UserMenu
- **Validation Method:** `useAuth()` hook returns `isLoading` state
- **Interface Effect:** Show full-page loading spinner while `isLoading === true`

### Modal Exclusivity
- **Condition:** Only one modal can be open at a time
- **Components Affected:** KeyboardShortcutsHelp, CommandPalette
- **Validation Method:** Close other modals before opening new one
- **Interface Effect:** Opening command palette closes help overlay and vice versa

### Keyboard Shortcut Conflicts
- **Condition:** Browser shortcuts must not conflict with app shortcuts
- **Components Affected:** GlobalKeyboardHandler
- **Validation Method:** `event.preventDefault()` on handled shortcuts
- **Interface Effect:** `Cmd+W` navigates to Work Mode instead of closing window

## 10. Error Handling

### Authentication Errors
- **Scenario:** User session expires or JWT is invalid
- **Detection:** API returns 401 Unauthorized
- **Handling:**
  1. Clear TanStack Query cache
  2. Redirect to landing page
  3. Show simple message: "Session expired. Please sign in again."

### Logout Errors
- **Scenario:** Logout API call fails (network error, server error)
- **Detection:** Mutation returns error
- **Handling:**
  1. Still clear local cache and redirect (client-side logout)
  2. Log error to console for debugging
  3. Optional: Show toast notification (minimal, non-blocking)

### Network Errors
- **Scenario:** Network connection lost during app usage
- **Detection:** `navigator.onLine === false` or fetch fails
- **Handling:**
  1. Detect offline state with `navigator.onLine`
  2. Show non-intrusive banner at top: "You're offline. Some features may not work."
  3. TanStack Query will automatically retry on reconnection

### Modal Rendering Errors
- **Scenario:** Modal component fails to render (unlikely)
- **Detection:** React error boundary
- **Handling:**
  1. Error boundary at AppShell level catches error
  2. Show fallback UI: "Something went wrong. Please refresh the page."
  3. Provide "Refresh" button

### Keyboard Event Conflicts
- **Scenario:** User in text input, global shortcut triggered
- **Detection:** Check `event.target` type before handling
- **Handling:**
  1. Ignore global shortcuts when focused on input/textarea
  2. Exception: `Esc` always closes modals
  3. Command palette always opens regardless of focus

## 11. Implementation Steps

### Step 1: Setup Astro Page and Middleware
1. Create `apps/frontend/src/pages/app/[...slug].astro`
2. Implement Astro middleware at `apps/frontend/src/middleware.ts`
3. Add JWT cookie validation logic
4. Redirect unauthenticated users to `/`
5. Mount React app in Astro page with TanStack Query provider

### Step 2: Create API Client and Auth Hook
1. Create `apps/frontend/src/lib/api/client.ts` (base fetch wrapper)
2. Create `apps/frontend/src/lib/api/auth.ts` (getMe, logout functions)
3. Implement `apps/frontend/src/hooks/use-auth.ts` with TanStack Query
4. Test authentication flow (loading, success, error states)

### Step 3: Build AppShell Container
1. Create `apps/frontend/src/components/app-shell/AppShell.tsx`
2. Implement layout structure (header + main content area)
3. Add modal state management (useState for help and command palette)
4. Set up React Router with routes for Plan, Work, Done
5. Add loading state for initial user fetch

### Step 4: Implement AppHeader and Navigation
1. Create `apps/frontend/src/components/app-shell/AppHeader.tsx`
2. Create `apps/frontend/src/components/app-shell/ModeNavigation.tsx`
3. Create `apps/frontend/src/components/app-shell/ModeButton.tsx`
4. Implement active state indication based on current route
5. Add click handlers for mode switching

### Step 5: Build UserMenu Component
1. Create `apps/frontend/src/components/app-shell/UserMenu.tsx`
2. Integrate shadcn/ui DropdownMenu components
3. Add user avatar/name display
4. Implement menu items (Keyboard Shortcuts, Logout)
5. Wire up logout mutation and help modal trigger

### Step 6: Implement GlobalKeyboardHandler
1. Create `apps/frontend/src/components/app-shell/GlobalKeyboardHandler.tsx`
2. Add keydown event listener on component mount
3. Implement key combination detection (Cmd/Ctrl modifiers)
4. Add handlers for: `?`, `Cmd+K`, `Cmd+P`, `Cmd+W`, `Cmd+D`, `Esc`
5. Prevent default browser behavior for app shortcuts
6. Handle focus context (ignore shortcuts in text inputs)

### Step 7: Build KeyboardShortcutsHelp Modal
1. Create `apps/frontend/src/components/app-shell/KeyboardShortcutsHelp.tsx`
2. Integrate shadcn/ui Dialog component
3. Create keyboard shortcuts data structure (categories, keys, descriptions)
4. Implement search/filter functionality
5. Add visual keyboard key representation (e.g., `<kbd>`)
6. Wire up open/close state to `?` shortcut

### Step 8: Build CommandPalette Modal
1. Create `apps/frontend/src/components/app-shell/CommandPalette.tsx`
2. Integrate shadcn/ui Command component (cmdk)
3. Define command items (Navigation, Actions, Help)
4. Implement command execution on selection
5. Wire up open/close state to `Cmd+K` shortcut
6. Add icons from lucide-react for visual clarity

### Step 9: Implement Error Boundaries
1. Create `apps/frontend/src/components/ErrorBoundary.tsx`
2. Wrap AppShell in error boundary
3. Implement fallback UI for rendering errors
4. Add "Refresh Page" action

### Step 10: Add Loading States
1. Implement full-page loading spinner for initial user fetch
2. Show spinner centered in viewport while `isLoading === true`
3. Use shadcn/ui Spinner or simple CSS animation
4. Ensure smooth transition to app content on load

### Step 11: Style and Polish
1. Apply Tailwind CSS for layout and spacing
2. Ensure responsive design (mobile, tablet, desktop)
3. Add focus indicators for accessibility
4. Test keyboard navigation throughout app shell
5. Verify color contrast ratios meet WCAG AA

### Step 12: Testing and Refinement
1. Test all keyboard shortcuts in different browsers
2. Verify authentication flow (login, logout, session expiry)
3. Test modal open/close interactions
4. Check mobile responsive layout
5. Validate accessibility with screen reader
6. Test error scenarios (network failure, logout error)

### Step 13: Integration with Child Views
1. Create placeholder components for Plan, Work, Done views
2. Verify routing works correctly
3. Test navigation between modes
4. Ensure modal state doesn't interfere with child view interactions
5. Validate that global shortcuts work from all views
