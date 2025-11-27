# API Client Implementation Plan

## Overview

Build a simple, typed API client for the GSD frontend to communicate with the NestJS backend. This will be built in **small, beginner-friendly chunks** to avoid complexity.

**Target Audience:** Frontend beginners
**Approach:** Simple over clever, small files, clear naming

---

## Goals

1. Type-safe communication with backend (using `@gsd/types`)
2. Simple error handling (no complex retry logic in MVP)
3. Authentication via JWT cookies (already handled by browser)
4. Easy-to-use interface for all backend endpoints

---

## Architecture - Simple Layers

```
Frontend Components
       ↓
  React Hooks (useListsQuery, etc.)
       ↓
  API Client (fetch wrapper)
       ↓
  Backend REST API
```

**3 Simple Layers:**
1. **API Client** - Low-level fetch wrapper
2. **React Hooks** - TanStack Query hooks
3. **Components** - UI that uses hooks

---

## Implementation Steps (Incremental)

### Step 1: Basic Fetch Wrapper (30 mins)
**File:** `apps/frontend/src/lib/api/client.ts` (~40 lines)

**Purpose:** Simple wrapper around `fetch()` that:
- Adds base URL
- Handles JSON parsing
- Throws on HTTP errors

**Example:**
```typescript
async function apiRequest(endpoint: string, options?: RequestInit) {
  const baseUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
```

### Step 2: Typed API Functions - Lists (30 mins)
**File:** `apps/frontend/src/lib/api/lists.ts` (~50 lines)

**Purpose:** One file with all list-related API calls.

**Example:**
```typescript
import type { GetListsResponseDto, CreateListRequest, ListDto } from '@gsd/types';

export async function getLists(): Promise<GetListsResponseDto> {
  return apiRequest('/v1/lists');
}

export async function createList(data: CreateListRequest): Promise<ListDto> {
  return apiRequest('/v1/lists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ... more list functions
```

### Step 3: Typed API Functions - Tasks (30 mins)
**File:** `apps/frontend/src/lib/api/tasks.ts` (~60 lines)

Similar to lists, one function per endpoint.

### Step 4: Typed API Functions - Done & Metrics (30 mins)
**Files:**
- `apps/frontend/src/lib/api/done.ts` (~30 lines)
- `apps/frontend/src/lib/api/metrics.ts` (~30 lines)

### Step 5: Simple Error Types (15 mins)
**File:** `apps/frontend/src/lib/api/errors.ts` (~30 lines)

**Purpose:** Define what errors look like.

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
  ) {
    super(message);
  }
}
```

### Step 6: React Query Hook - Lists (30 mins)
**File:** `apps/frontend/src/hooks/api/useLists.ts` (~40 lines)

**Purpose:** Simple hook that wraps TanStack Query.

```typescript
import { useQuery } from '@tanstack/react-query';
import { getLists } from '@/lib/api/lists';

export function useListsQuery() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: getLists,
  });
}
```

### Step 7: React Query Hooks - Tasks, Done, Metrics (1 hour)
**Files:**
- `apps/frontend/src/hooks/api/useTasks.ts`
- `apps/frontend/src/hooks/api/useDone.ts`
- `apps/frontend/src/hooks/api/useMetrics.ts`

### Step 8: Mutation Hooks - Create/Update/Delete (1.5 hours)
**File:** `apps/frontend/src/hooks/api/useMutations.ts` (~80 lines)

**Purpose:** Hooks for creating, updating, deleting data.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createList } from '@/lib/api/lists';

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createList,
    onSuccess: () => {
      // Refetch lists after creating one
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}
```

---

## File Structure (Final)

```
apps/frontend/src/
├── lib/
│   └── api/
│       ├── client.ts        # Basic fetch wrapper (40 lines)
│       ├── errors.ts        # Error types (30 lines)
│       ├── lists.ts         # List API calls (50 lines)
│       ├── tasks.ts         # Task API calls (60 lines)
│       ├── done.ts          # Done API calls (30 lines)
│       └── metrics.ts       # Metrics API calls (30 lines)
└── hooks/
    └── api/
        ├── useLists.ts      # List hooks (40 lines)
        ├── useTasks.ts      # Task hooks (50 lines)
        ├── useDone.ts       # Done hooks (30 lines)
        ├── useMetrics.ts    # Metrics hooks (30 lines)
        └── useMutations.ts  # Create/update/delete (80 lines)
```

**Total:** ~520 lines across 10 small files

---

## Design Decisions (Beginner-Friendly)

### ✅ Keep It Simple

1. **One function per endpoint** - Easy to find and understand
2. **No complex error handling** - Just throw errors, let React Query handle retries
3. **No request interceptors** - Cookies are automatic
4. **No response transformers** - Backend sends the right format
5. **No caching logic** - TanStack Query handles this

### ✅ Type Safety

1. Import types from `@gsd/types` - Single source of truth
2. TypeScript will catch mismatches
3. No manual type casting

### ✅ Small Files

1. Each file < 80 lines
2. One responsibility per file
3. Easy to read and modify

---

## API Endpoints Reference (from Backend)

### Authentication
- ✅ `POST /auth/google` - Handled by landing page
- ✅ `GET /auth/google/callback` - Handled by Astro
- ✅ `POST /auth/signout` - Will add to API client
- ✅ `GET /auth/me` - Will add to API client

### Lists
- `GET /v1/lists` - Fetch all user lists
- `POST /v1/lists` - Create new list
- `PATCH /v1/lists/:id` - Update list name
- `DELETE /v1/lists/:id?destinationListId=X` - Delete list with destination
- `POST /v1/lists/:id/toggle-backlog` - Toggle backlog status
- `POST /v1/lists/:id/reorder` - Reorder lists

### Tasks
- `GET /v1/tasks?listId=X` - Fetch tasks (filtered by list)
- `POST /v1/tasks` - Create task
- `PATCH /v1/tasks/:id` - Update task
- `DELETE /v1/tasks/:id` - Delete task
- `POST /v1/tasks/:id/move` - Move task to different list
- `POST /v1/tasks/:id/reorder` - Reorder task within list
- `POST /v1/tasks/:id/complete` - Mark task complete (moves to Done)

### Done & Metrics
- `GET /v1/done?limit=50&offset=0` - Fetch completed tasks (paginated)
- `GET /v1/metrics/daily?startDate=X&endDate=Y&timezone=Z` - Daily completion counts
- `GET /v1/metrics/weekly?startDate=X&endDate=Y&timezone=Z` - Weekly completion counts

---

## Environment Variables

**File:** `apps/frontend/.env` (create if doesn't exist)

```bash
PUBLIC_API_URL=http://localhost:3000
```

**Production:** `https://api.gsd.app` (or whatever domain)

---

## Testing Strategy (Simple)

### Manual Testing (MVP)
1. Test each API function in browser console
2. Use React Query DevTools to see requests
3. Check Network tab in browser

### Automated Testing (Post-MVP)
- Add tests after MVP is working
- Focus on functionality first

---

## Error Handling Strategy (Simple)

### What We'll Do:
1. **Throw errors** from API client
2. **Let React Query catch them** - It has built-in error handling
3. **Display errors in UI** - Simple inline messages

### What We Won't Do (MVP):
- ❌ Complex retry logic
- ❌ Error toast notifications
- ❌ Offline queue
- ❌ Optimistic updates (except where easy)

---

## React Query Configuration

**File:** `apps/frontend/src/components/QueryProvider.tsx` (already exists)

**Simple defaults:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,              // Retry once on failure
      staleTime: 30_000,     // Data fresh for 30 seconds
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    },
  },
});
```

---

## Implementation Order

### Week 1: Foundation
1. ✅ Day 1: Basic fetch wrapper + Lists API
2. ✅ Day 2: Tasks API + Done API + Metrics API
3. ✅ Day 3: Error handling + useListsQuery hook
4. ✅ Day 4: useTasks, useDone, useMetrics hooks
5. ✅ Day 5: Mutation hooks (create/update/delete)

### Testing Each Step:
After each file:
1. Import it in a test component
2. Call the function
3. Check Network tab
4. Verify response type

---

## Success Criteria

✅ **Complete when:**
1. All backend endpoints have typed API functions
2. All API functions have React Query hooks
3. Can fetch lists/tasks/done/metrics in a component
4. Can create/update/delete via mutation hooks
5. TypeScript shows no errors
6. Network tab shows correct requests

---

## Next Steps After API Client

Once API client is complete:
1. Build Plan Mode layout (uses useListsQuery, useTasksQuery)
2. Add task creation form (uses useCreateTask mutation)
3. Add keyboard navigation
4. Build Work Mode
5. Build Done Archive

---

## Example Component Usage (Preview)

```typescript
// Example: Simple component that shows lists
function MyListsComponent() {
  const { data, isLoading, error } = useListsQuery();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.lists.map(list => (
        <li key={list.id}>{list.name}</li>
      ))}
    </ul>
  );
}
```

**Simple! No complex logic, just use the hook.**

---

## Notes for Beginners

### Don't Worry About:
- Performance optimization (do this later)
- Advanced patterns (keep it simple)
- Perfect code (make it work first)

### Do Focus On:
- Type safety (TypeScript will help you)
- Small files (easier to understand)
- One thing at a time (don't build everything at once)

### When Stuck:
1. Read the error message carefully
2. Check Network tab (is request correct?)
3. Check backend endpoint (is it working?)
4. Look at existing code patterns
5. Ask for help!

---

## Validation Checklist

Before marking API client complete:

- [ ] All API files created and exported
- [ ] All hooks created and exported
- [ ] TypeScript compiles without errors
- [ ] Can import and use hooks in components
- [ ] Network requests show in browser DevTools
- [ ] Responses match expected types
- [ ] Errors are caught and displayed

---

**Estimated Total Time:** 6-8 hours (spread over 2-3 days)
**Complexity:** Low (beginner-friendly)
**Risk:** Low (worst case: fix small files one at a time)
