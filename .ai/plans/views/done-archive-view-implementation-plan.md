# View Implementation Plan: Done Archive

## 1. Overview

The Done Archive view is a read-only, paginated interface that displays completed tasks in reverse chronological order. It features a metrics header showing daily and weekly completion counts, providing users with visibility into their accomplishments. The view supports pagination (50 tasks per page), displays timestamps in the user's local timezone with relative/absolute formatting, and includes visual indicators for task origin through backlog colors.

## 2. View Routing

**Path:** `/app/done`

**Route Type:** React SPA route (client-side routing within authenticated app shell)

**Access:** Authenticated users only (protected by app shell authentication)

**Navigation Methods:**
- Mode switcher in AppHeader
- Keyboard shortcut: `Cmd+Shift+A`
- Command Palette: "Go to Done Archive"

## 3. Component Structure

```
DoneView (Route Component)
├── AppHeader (shared component - already exists)
├── MetricsHeader
│   ├── MetricBadge (Today)
│   ├── MetricBadge (This Week)
│   └── MetricBadge (Last Week)
├── CompletedTaskList
│   ├── CompletedTaskCard (for each task)
│   │   ├── TaskColorIndicator
│   │   ├── TaskTitle
│   │   ├── TaskDescription (if present)
│   │   └── CompletionTimestamp
│   └── EmptyDoneState (when no tasks)
└── PaginationControls
    ├── PreviousButton
    ├── PageButton (for each visible page number)
    ├── NextButton
    └── ResultsCount
```

## 4. Component Details

### DoneView (Main Route Component)

**Component Description:**
Main container for the Done Archive view. Orchestrates data fetching for completed tasks and metrics, manages pagination state, and renders the layout structure. Handles URL synchronization for the current page parameter.

**Main Elements:**
- AppHeader (reused from app shell)
- MetricsHeader (displays completion counts)
- CompletedTaskList (paginated task list)
- PaginationControls (navigation between pages)

**Handled Interactions:**
- Page navigation (via PaginationControls)
- URL parameter synchronization (?page=N)
- Initial data fetching on mount

**Handled Validation:**
- Validate page number is within valid range (1 to totalPages)
- Redirect to page 1 if invalid page parameter in URL
- Handle empty state when no completed tasks exist

**Types:**
- `GetDoneResponseDto` (from @gsd/types)
- `DailyMetricsResponseDto` (from @gsd/types)
- `WeeklyMetricsResponseDto` (from @gsd/types)
- `MetricsSummary` (view model, defined below)
- `PaginationInfo` (view model, defined below)

**Props:**
None (route component, reads from URL and internal state)

**State:**
```typescript
const [currentPage, setCurrentPage] = useState<number>(1);
const timezone = useTimezoneDetection();
```

**Data Fetching:**
```typescript
const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useDoneTasksQuery(currentPage);
const { data: metricsData, isLoading: metricsLoading } = useMetricsQuery();
```

---

### MetricsHeader

**Component Description:**
Displays a compact metrics summary bar showing task completion counts for today, this week, and last week. Fetches data from daily and weekly metrics endpoints and computes summary statistics. Shows loading skeletons during data fetch and subtle timezone indicator.

**Main Elements:**
- Container div (horizontal flex layout)
- Three MetricBadge components
- Timezone indicator text (subtle, right-aligned)

**Handled Interactions:**
None (read-only display)

**Handled Validation:**
- Handle loading state (show skeleton loaders)
- Handle error state (show error message or hide metrics)
- Gracefully handle missing data

**Types:**
- `MetricsSummary` (view model)
- `DailyMetricsResponseDto` (from API)
- `WeeklyMetricsResponseDto` (from API)

**Props:**
```typescript
interface MetricsHeaderProps {
  metrics: MetricsSummary | undefined;
  isLoading: boolean;
  error?: Error | null;
}
```

**Implementation Notes:**
- Displays "Today: X tasks • This week: Y tasks • Last week: Z tasks"
- Uses bullet separator (•) between metrics
- Timezone shown as short name (e.g., "PST") or offset (e.g., "UTC-8")
- Loading state shows 3 skeleton badges
- Error state shows subtle message or hides component

---

### MetricBadge

**Component Description:**
Individual metric display showing an icon, label, and count. Used within MetricsHeader to display completion counts.

**Main Elements:**
- Container div (inline-flex layout)
- Icon (lucide-react icon, e.g., CheckCircle)
- Label text (e.g., "Today")
- Count number (bold)

**Handled Interactions:**
None (read-only display)

**Handled Validation:**
None

**Types:**
```typescript
interface MetricBadgeProps {
  label: string;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
}
```

**Props:**
- `label`: string - Display label (e.g., "Today", "This Week")
- `count`: number - Number of completed tasks
- `icon`: Optional icon component

---

### CompletedTaskList

**Component Description:**
Scrollable container for completed task cards. Renders tasks in reverse chronological order (newest first). Handles empty state when no tasks exist and loading state during data fetch.

**Main Elements:**
- Semantic `<ul>` element for task list
- CompletedTaskCard components as `<li>` items
- EmptyDoneState when tasks array is empty
- Loading skeletons during fetch

**Handled Interactions:**
None (read-only, no task actions)

**Handled Validation:**
- Check if tasks array is empty → show EmptyDoneState
- Check if loading → show skeleton loaders
- Check if error → show error message with retry option

**Types:**
- `DoneTaskDto[]` (from @gsd/types)

**Props:**
```typescript
interface CompletedTaskListProps {
  tasks: DoneTaskDto[];
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}
```

**Accessibility:**
- Semantic `<ul>` element
- Each task as `<li>` with proper ARIA attributes
- Screen reader announces "Completed tasks list, X items"

---

### CompletedTaskCard

**Component Description:**
Read-only display of a single completed task. Shows task title, description (if present), completion timestamp (relative or absolute based on recency), and origin backlog color indicator. No interactive actions available.

**Main Elements:**
- Container `<li>` element
- Left border div (4px, origin backlog color)
- Task title (bold)
- Task description (if present, truncated to 3 lines)
- Completion timestamp (relative or absolute)
- Origin backlog name (subtle text)

**Handled Interactions:**
None (read-only, no click/hover actions)

**Handled Validation:**
- Display description only if not null
- Choose relative vs absolute timestamp based on recency
- Truncate long descriptions with ellipsis

**Types:**
- `DoneTaskDto` (from @gsd/types)
- `TimestampDisplay` (view model)

**Props:**
```typescript
interface CompletedTaskCardProps {
  task: DoneTaskDto;
}
```

**Styling:**
- 4px left border in `task.color` (origin backlog color)
- Padding: p-4
- Border: border border-gray-200
- Rounded corners: rounded-lg
- Hover: subtle background change (bg-gray-50)

**Accessibility:**
- Semantic `<li>` element within `<ul>`
- Task title as `<h3>`
- Description in `<p>` tag
- Timestamp in `<time>` element with datetime attribute
- ARIA label with full task details for screen readers

---

### TaskColorIndicator

**Component Description:**
Visual indicator showing the task's origin backlog color. Displayed as a 4px vertical left border on CompletedTaskCard.

**Main Elements:**
- Div with absolute positioning
- 4px width, full height, colored border

**Handled Interactions:**
None

**Handled Validation:**
- Ensure color is valid hex format
- Fallback to default color if invalid

**Types:**
```typescript
interface TaskColorIndicatorProps {
  color: string; // hex color
}
```

**Props:**
- `color`: string - Hex color from origin backlog (e.g., "#3B82F6")

---

### CompletionTimestamp

**Component Description:**
Displays task completion timestamp in user's local timezone. Shows relative time ("2 hours ago") for recent completions (< 7 days) and absolute time ("Jan 5, 2025 3:42 PM") for older completions. Both formats available in tooltip for context.

**Main Elements:**
- `<time>` semantic element with datetime attribute
- Primary display text (relative or absolute)
- Tooltip showing both formats

**Handled Interactions:**
- Hover to show tooltip with both relative and absolute times

**Handled Validation:**
- Parse completedAt date correctly
- Handle invalid dates gracefully
- Compute relative time threshold (7 days)

**Types:**
- `TimestampDisplay` (view model)

**Props:**
```typescript
interface CompletionTimestampProps {
  completedAt: Date;
  timezone: string;
}
```

**Implementation Notes:**
- Use date-fns `formatDistanceToNow` for relative time
- Use date-fns `format` for absolute time with pattern: "MMM d, yyyy h:mm a"
- Display relative time primarily if < 7 days old
- Tooltip shows: "Completed {relative} ({absolute})"
- `<time>` datetime attribute: ISO 8601 format

---

### EmptyDoneState

**Component Description:**
Displayed when user has no completed tasks. Shows encouraging message and call-to-action to navigate to Work Mode to start completing tasks.

**Main Elements:**
- Container div (centered, vertical layout)
- Icon (CheckCircle with gray color)
- Heading: "No completed tasks yet"
- Description text: "Start completing tasks in Work Mode to see them here."
- Button: "Go to Work Mode"

**Handled Interactions:**
- Click "Go to Work Mode" button → navigate to /app/work

**Handled Validation:**
None

**Types:**
None

**Props:**
None

---

### PaginationControls

**Component Description:**
Navigation controls for paginated task list. Displays Previous/Next buttons, page number buttons, and results count. Handles page changes and disables buttons at boundaries.

**Main Elements:**
- Container nav element (horizontal flex layout)
- Previous button (disabled on page 1)
- Page number buttons (1, 2, 3, ..., last)
- Next button (disabled on last page)
- Results count text: "Showing 1-50 of 237"

**Handled Interactions:**
- Click Previous button → navigate to currentPage - 1
- Click page number button → navigate to selected page
- Click Next button → navigate to currentPage + 1

**Handled Validation:**
- Disable Previous button when currentPage === 1
- Disable Next button when currentPage === totalPages
- Highlight current page button (aria-current="page")
- Show ellipsis (...) for truncated page numbers if totalPages > 7

**Types:**
- `PaginationInfo` (view model)

**Props:**
```typescript
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  total: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}
```

**Accessibility:**
- Semantic `<nav>` with aria-label="Pagination"
- Page buttons as `<button>` elements
- aria-current="page" on current page button
- Disabled buttons have aria-disabled="true"
- Results count announced to screen readers

**Implementation Notes:**
- Page number truncation logic:
  - If totalPages <= 7: show all page numbers
  - If totalPages > 7: show first page, ellipsis, currentPage-1, currentPage, currentPage+1, ellipsis, last page
- Results count format: "Showing {start}-{end} of {total}"
  - start = (currentPage - 1) * itemsPerPage + 1
  - end = min(currentPage * itemsPerPage, total)

---

## 5. Types

### Shared Types (from @gsd/types)

**DoneTaskDto:**
```typescript
export interface DoneTaskDto {
  id: string;
  title: string;
  description: string | null;
  completedAt: Date;
  listId: string;
  listName: string;
  color: string; // origin backlog color (hex)
  originBacklogId: string;
}
```

**GetDoneResponseDto:**
```typescript
export interface GetDoneResponseDto {
  tasks: DoneTaskDto[];
  total: number;
  limit: number;
  offset: number;
}
```

**DailyMetricsResponseDto:**
```typescript
export interface DailyMetricsResponseDto {
  metrics: DailyMetric[];
  startDate: string;
  endDate: string;
  timezone: string;
  totalCompleted: number;
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  count: number;
  timezone: string;
}
```

**WeeklyMetricsResponseDto:**
```typescript
export interface WeeklyMetricsResponseDto {
  metrics: WeeklyMetric[];
  startDate: string;
  endDate: string;
  timezone: string;
  totalCompleted: number;
  totalWeeks: number;
}

export interface WeeklyMetric {
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  count: number;
  timezone: string;
}
```

### View Models (New Types)

**MetricsSummary:**
```typescript
interface MetricsSummary {
  todayCount: number;
  thisWeekCount: number;
  lastWeekCount: number;
  timezone: string; // IANA timezone or short name (e.g., "PST")
}
```
- **todayCount**: Number of tasks completed today (current date in user's timezone)
- **thisWeekCount**: Number of tasks completed this week (Monday to now)
- **lastWeekCount**: Number of tasks completed last week (previous Monday-Sunday)
- **timezone**: User's timezone for display context

**TimestampDisplay:**
```typescript
interface TimestampDisplay {
  relative: string; // e.g., "2 hours ago", "3 days ago"
  absolute: string; // e.g., "Jan 5, 2025 3:42 PM"
  useRelative: boolean; // true if timestamp is recent (< 7 days)
}
```
- **relative**: Human-readable relative time computed using date-fns `formatDistanceToNow`
- **absolute**: Formatted absolute time using date-fns `format` with pattern "MMM d, yyyy h:mm a"
- **useRelative**: Boolean flag to determine primary display (true for recent tasks < 7 days old)

**PaginationInfo:**
```typescript
interface PaginationInfo {
  currentPage: number; // 1-indexed
  totalPages: number;
  total: number; // total items across all pages
  itemsPerPage: number; // 50 for done tasks
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```
- **currentPage**: Current page number (1-indexed)
- **totalPages**: Total number of pages (computed as Math.ceil(total / itemsPerPage))
- **total**: Total number of completed tasks across all pages
- **itemsPerPage**: Number of items per page (constant: 50)
- **hasNextPage**: True if currentPage < totalPages
- **hasPreviousPage**: True if currentPage > 1

## 6. State Management

### TanStack Query Hooks

**useDoneTasksQuery(page: number):**
```typescript
function useDoneTasksQuery(page: number) {
  return useQuery({
    queryKey: ['done', page],
    queryFn: async () => {
      const response = await fetch(`/v1/done?page=${page}&limit=50`, {
        credentials: 'include', // include JWT cookie
      });
      if (!response.ok) throw new Error('Failed to fetch completed tasks');
      return response.json() as Promise<GetDoneResponseDto>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}
```
- **Purpose**: Fetch paginated completed tasks
- **Query Key**: `['done', page]` - includes page for cache per page
- **API Call**: `GET /v1/done?page={page}&limit=50`
- **Returns**: GetDoneResponseDto
- **Caching**: 5 minutes stale time, 3 retries on failure

**useMetricsQuery():**
```typescript
function useMetricsQuery() {
  const timezone = useTimezoneDetection();

  return useQuery({
    queryKey: ['metrics', timezone],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const lastWeekStart = format(subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), 'yyyy-MM-dd');
      const lastWeekEnd = format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [dailyResponse, weeklyResponse] = await Promise.all([
        fetch(`/v1/metrics/daily?startDate=${today}&endDate=${today}&timezone=${timezone}`, {
          credentials: 'include',
        }),
        fetch(`/v1/metrics/weekly?startDate=${lastWeekStart}&endDate=${today}&timezone=${timezone}`, {
          credentials: 'include',
        }),
      ]);

      if (!dailyResponse.ok || !weeklyResponse.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const dailyData: DailyMetricsResponseDto = await dailyResponse.json();
      const weeklyData: WeeklyMetricsResponseDto = await weeklyResponse.json();

      // Compute summary
      const todayCount = dailyData.metrics[0]?.count ?? 0;
      const thisWeekCount = weeklyData.metrics.find(m =>
        m.weekStartDate === thisWeekStart
      )?.count ?? 0;
      const lastWeekCount = weeklyData.metrics.find(m =>
        m.weekStartDate === lastWeekStart
      )?.count ?? 0;

      return {
        todayCount,
        thisWeekCount,
        lastWeekCount,
        timezone: getTimezoneShortName(timezone),
      } as MetricsSummary;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}
```
- **Purpose**: Fetch and compute daily/weekly metrics summary
- **Query Key**: `['metrics', timezone]` - includes timezone for cache
- **API Calls**:
  - `GET /v1/metrics/daily?startDate={today}&endDate={today}&timezone={timezone}`
  - `GET /v1/metrics/weekly?startDate={lastWeekStart}&endDate={today}&timezone={timezone}`
- **Returns**: MetricsSummary (computed from responses)
- **Caching**: 5 minutes stale time, 3 retries on failure
- **Date Computation**:
  - Today: current date (YYYY-MM-DD)
  - This week start: current week Monday (using date-fns startOfWeek with weekStartsOn: 1)
  - Last week start/end: previous week Monday-Sunday

### Local State

**currentPage:**
```typescript
const [currentPage, setCurrentPage] = useState<number>(() => {
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get('page');
  return pageParam ? parseInt(pageParam, 10) : 1;
});
```
- **Purpose**: Track current page number for pagination
- **Initial Value**: Read from URL ?page parameter, default to 1
- **Updates**: When user clicks pagination controls

### Custom Hooks

**useTimezoneDetection():**
```typescript
function useTimezoneDetection(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Failed to detect timezone, falling back to UTC', error);
    return 'UTC';
  }
}
```
- **Purpose**: Detect user's IANA timezone from browser
- **Returns**: string (e.g., "America/New_York", "Europe/London")
- **Fallback**: "UTC" if detection fails

**useRelativeTime(date: Date): TimestampDisplay:**
```typescript
function useRelativeTime(date: Date, timezone: string): TimestampDisplay {
  const now = new Date();
  const diffDays = differenceInDays(now, date);
  const useRelative = diffDays < 7;

  return {
    relative: formatDistanceToNow(date, { addSuffix: true }),
    absolute: format(date, 'MMM d, yyyy h:mm a'),
    useRelative,
  };
}
```
- **Purpose**: Format date as relative and absolute time
- **Parameters**: date (completedAt), timezone (for context)
- **Returns**: TimestampDisplay object
- **Logic**: Use relative time if < 7 days old, otherwise absolute

**usePagination(currentPage: number, totalPages: number): PaginationInfo:**
```typescript
function usePagination(currentPage: number, totalPages: number, total: number, itemsPerPage: number): PaginationInfo {
  return {
    currentPage,
    totalPages,
    total,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}
```
- **Purpose**: Compute pagination state and helpers
- **Returns**: PaginationInfo object
- **Logic**: Calculate hasNextPage/hasPreviousPage flags

### URL Synchronization

**Effect to sync currentPage with URL:**
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  params.set('page', currentPage.toString());
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newUrl);
}, [currentPage]);
```
- **Purpose**: Keep URL ?page parameter in sync with currentPage state
- **Method**: Use replaceState (not pushState) to avoid polluting browser history

**Effect to validate page number:**
```typescript
useEffect(() => {
  if (tasksData && currentPage > Math.ceil(tasksData.total / tasksData.limit)) {
    setCurrentPage(1);
  }
}, [tasksData, currentPage]);
```
- **Purpose**: Redirect to page 1 if currentPage exceeds totalPages
- **Triggers**: When tasksData updates or currentPage changes

## 7. API Integration

### Endpoint 1: GET /v1/done

**Request Type:** GET with query parameters

**Query Parameters:**
- `page`: number (1-indexed, from currentPage state)
- `limit`: number (constant: 50)

**Request Example:**
```
GET /v1/done?page=2&limit=50
Cookie: jwt={token}
```

**Response Type:** GetDoneResponseDto

**Response Example:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Review PRD document",
      "description": "Check for completeness",
      "completedAt": "2025-01-15T14:30:00Z",
      "listId": "uuid",
      "listName": "Today",
      "color": "#3B82F6",
      "originBacklogId": "uuid"
    }
  ],
  "total": 237,
  "limit": 50,
  "offset": 50
}
```

**Usage:** Fetched by `useDoneTasksQuery(currentPage)` hook

**Error Handling:**
- 401 Unauthorized → Redirect to login
- 404 Not Found → Show empty state
- 500 Server Error → Show error message with retry button

---

### Endpoint 2: GET /v1/metrics/daily

**Request Type:** GET with query parameters

**Query Parameters:**
- `startDate`: string (YYYY-MM-DD, today's date)
- `endDate`: string (YYYY-MM-DD, today's date)
- `timezone`: string (from useTimezoneDetection)

**Request Example:**
```
GET /v1/metrics/daily?startDate=2025-01-15&endDate=2025-01-15&timezone=America/New_York
Cookie: jwt={token}
```

**Response Type:** DailyMetricsResponseDto

**Response Example:**
```json
{
  "metrics": [
    {
      "date": "2025-01-15",
      "count": 8,
      "timezone": "America/New_York"
    }
  ],
  "startDate": "2025-01-15",
  "endDate": "2025-01-15",
  "timezone": "America/New_York",
  "totalCompleted": 8
}
```

**Usage:** Fetched by `useMetricsQuery()` hook for today's count

**Error Handling:**
- 401 Unauthorized → Redirect to login
- 500 Server Error → Show "0" or hide metrics

---

### Endpoint 3: GET /v1/metrics/weekly

**Request Type:** GET with query parameters

**Query Parameters:**
- `startDate`: string (YYYY-MM-DD, last week Monday)
- `endDate`: string (YYYY-MM-DD, this Sunday or today)
- `timezone`: string (from useTimezoneDetection)

**Request Example:**
```
GET /v1/metrics/weekly?startDate=2025-01-06&endDate=2025-01-19&timezone=America/New_York
Cookie: jwt={token}
```

**Response Type:** WeeklyMetricsResponseDto

**Response Example:**
```json
{
  "metrics": [
    {
      "weekStartDate": "2025-01-06",
      "weekEndDate": "2025-01-12",
      "count": 28,
      "timezone": "America/New_York"
    },
    {
      "weekStartDate": "2025-01-13",
      "weekEndDate": "2025-01-19",
      "count": 32,
      "timezone": "America/New_York"
    }
  ],
  "startDate": "2025-01-06",
  "endDate": "2025-01-19",
  "timezone": "America/New_York",
  "totalCompleted": 60,
  "totalWeeks": 2
}
```

**Usage:** Fetched by `useMetricsQuery()` hook for this week and last week counts

**Error Handling:**
- 401 Unauthorized → Redirect to login
- 500 Server Error → Show "0" or hide metrics

## 8. User Interactions

### Interaction 1: Navigate to Done Archive

**Trigger:**
- User clicks "Done" button in mode switcher (AppHeader)
- User presses keyboard shortcut `Cmd+Shift+A`
- User selects "Go to Done Archive" from Command Palette

**Action:**
- Navigate to `/app/done` route
- React Router renders DoneView component
- currentPage state initializes to 1 (or from URL ?page parameter)
- useDoneTasksQuery(1) fetches first page of tasks
- useMetricsQuery() fetches metrics

**Expected Outcome:**
- View displays with AppHeader showing "Done" as active mode
- MetricsHeader displays today's, this week's, and last week's counts (or loading skeletons)
- CompletedTaskList displays 50 tasks (or loading skeletons)
- PaginationControls displays page 1 as active
- URL updates to `/app/done?page=1`

---

### Interaction 2: Navigate to Next Page

**Trigger:**
- User clicks "Next" button in PaginationControls
- User clicks page number button (e.g., "2")

**Action:**
- setCurrentPage(newPage) updates state
- useEffect syncs URL to ?page={newPage}
- useDoneTasksQuery(newPage) fetches new page data
- CompletedTaskList re-renders with new tasks

**Expected Outcome:**
- Task list updates with tasks from new page
- PaginationControls highlights new page number
- Previous button enabled if newPage > 1
- Next button disabled if newPage === totalPages
- URL updates to `/app/done?page={newPage}`
- Scroll position resets to top of task list

---

### Interaction 3: Navigate to Previous Page

**Trigger:**
- User clicks "Previous" button in PaginationControls

**Action:**
- setCurrentPage(currentPage - 1) updates state
- useEffect syncs URL to ?page={currentPage - 1}
- useDoneTasksQuery(currentPage - 1) fetches previous page data
- CompletedTaskList re-renders with new tasks

**Expected Outcome:**
- Task list updates with tasks from previous page
- PaginationControls highlights new page number
- Previous button disabled if now on page 1
- Next button enabled
- URL updates to `/app/done?page={currentPage - 1}`

---

### Interaction 4: View Task Details

**Trigger:**
- User visually scans completed tasks in list

**Action:**
- None (read-only view, no click/hover actions on tasks)

**Expected Outcome:**
- User can read task title, description, completion timestamp, and origin backlog name
- Hover state may add subtle background color for visual feedback
- No modals, popovers, or actions appear

---

### Interaction 5: Navigate Back to Plan or Work Mode

**Trigger:**
- User clicks "Plan" or "Work" in mode switcher
- User presses keyboard shortcuts `Cmd+P` or `Cmd+W`

**Action:**
- Navigate to `/app/plan` or `/app/work` route
- React Router unmounts DoneView, mounts PlanView or WorkView
- Done Archive state (currentPage) preserved in URL

**Expected Outcome:**
- View switches to Plan or Work mode
- AppHeader updates active mode indicator
- If user returns to Done Archive later, currentPage restored from URL or defaults to 1

---

### Interaction 6: Retry After Error

**Trigger:**
- Network error occurs during tasks fetch
- User clicks "Retry" button in error message

**Action:**
- Call queryClient.refetchQueries(['done', currentPage])
- useDoneTasksQuery re-executes API call

**Expected Outcome:**
- Loading state displays
- If successful: task list renders
- If failed again: error message persists

## 9. Conditions and Validation

### Condition 1: Page Number Validation

**Condition:** currentPage must be between 1 and totalPages (inclusive)

**Components Affected:**
- DoneView (useEffect to validate)
- PaginationControls (disable buttons at boundaries)

**Validation Logic:**
```typescript
// In DoneView useEffect
if (tasksData && currentPage > Math.ceil(tasksData.total / tasksData.limit)) {
  setCurrentPage(1); // redirect to page 1
}

// In PaginationControls
const hasPreviousPage = currentPage > 1;
const hasNextPage = currentPage < totalPages;
```

**Effect on UI:**
- Previous button disabled when currentPage === 1
- Next button disabled when currentPage === totalPages
- Invalid page in URL redirects to page 1

---

### Condition 2: Empty State (No Completed Tasks)

**Condition:** total === 0 (no tasks exist in Done list)

**Components Affected:**
- CompletedTaskList

**Validation Logic:**
```typescript
if (tasks.length === 0 && !isLoading) {
  return <EmptyDoneState />;
}
```

**Effect on UI:**
- EmptyDoneState component displays instead of task cards
- PaginationControls hidden (no pages to navigate)
- MetricsHeader shows "0" for all counts

---

### Condition 3: Timestamp Display Logic

**Condition:** completedAt within last 7 days

**Components Affected:**
- CompletionTimestamp

**Validation Logic:**
```typescript
const diffDays = differenceInDays(new Date(), completedAt);
const useRelative = diffDays < 7;
```

**Effect on UI:**
- If useRelative is true: display relative time ("2 hours ago")
- If useRelative is false: display absolute time ("Jan 5, 2025 3:42 PM")
- Tooltip shows both formats on hover

---

### Condition 4: Metrics Loading State

**Condition:** isLoading === true for metrics query

**Components Affected:**
- MetricsHeader

**Validation Logic:**
```typescript
if (isLoading) {
  return <MetricsHeaderSkeleton />;
}
```

**Effect on UI:**
- Three skeleton badges displayed during fetch
- No flicker or empty space
- Smooth transition to actual counts when loaded

---

### Condition 5: Tasks Loading State

**Condition:** isLoading === true for tasks query

**Components Affected:**
- CompletedTaskList

**Validation Logic:**
```typescript
if (isLoading) {
  return <TaskListSkeleton />;
}
```

**Effect on UI:**
- Skeleton loaders for 10 task cards displayed
- PaginationControls remain visible but disabled
- Smooth transition to actual tasks when loaded

---

### Condition 6: Pagination Display Truncation

**Condition:** totalPages > 7

**Components Affected:**
- PaginationControls

**Validation Logic:**
```typescript
if (totalPages <= 7) {
  return allPageNumbers; // [1, 2, 3, 4, 5, 6, 7]
} else {
  return truncatedPageNumbers; // [1, '...', 5, 6, 7, '...', 20]
}
```

**Effect on UI:**
- If totalPages <= 7: show all page number buttons
- If totalPages > 7: show first, ellipsis, currentPage-1, currentPage, currentPage+1, ellipsis, last
- Ellipsis rendered as non-interactive text

## 10. Error Handling

### Error 1: Network Error - Done Tasks Fetch Failed

**Scenario:** GET /v1/done returns network error or 500 status

**Handling:**
- Display inline error message in CompletedTaskList area
- Show retry button
- Preserve pagination controls (disabled)

**Component:** CompletedTaskList

**Error Message:**
```
"Failed to load completed tasks. Please check your connection and try again."
[Retry Button]
```

**Recovery:**
- User clicks Retry → calls queryClient.refetchQueries(['done', currentPage])
- Loading state displays → API call re-executes
- If successful: tasks render; if failed: error persists

---

### Error 2: Network Error - Metrics Fetch Failed

**Scenario:** GET /v1/metrics/* returns network error or 500 status

**Handling:**
- Display subtle error message in MetricsHeader or hide metrics section
- Do not block task list display

**Component:** MetricsHeader

**Error Message:**
```
"Unable to load metrics"
```

**Recovery:**
- Metrics section shows "—" or "N/A" for counts
- Or entire MetricsHeader hidden
- Does not prevent user from viewing completed tasks

---

### Error 3: Invalid Page Number in URL

**Scenario:** User manually enters /app/done?page=999 where totalPages < 999

**Handling:**
- useEffect validates currentPage against totalPages
- If invalid: setCurrentPage(1) redirects to page 1

**Component:** DoneView

**Implementation:**
```typescript
useEffect(() => {
  if (tasksData && currentPage > Math.ceil(tasksData.total / tasksData.limit)) {
    setCurrentPage(1);
  }
}, [tasksData, currentPage]);
```

**Recovery:**
- Page redirects to page 1
- URL updates to ?page=1
- User sees first page of tasks

---

### Error 4: Empty Response (No Completed Tasks)

**Scenario:** API returns tasks: [] with total: 0

**Handling:**
- Display EmptyDoneState component
- Hide pagination controls

**Component:** CompletedTaskList

**Empty State Content:**
```
[CheckCircle Icon - gray]
"No completed tasks yet"
"Start completing tasks in Work Mode to see them here."
[Go to Work Mode Button]
```

**Recovery:**
- User clicks "Go to Work Mode" → navigate to /app/work
- User completes tasks → returns to Done Archive → tasks now visible

---

### Error 5: Timezone Detection Failure

**Scenario:** Intl.DateTimeFormat() not available or throws error

**Handling:**
- Fallback to "UTC" timezone
- Log error to console for debugging

**Component:** useTimezoneDetection hook

**Implementation:**
```typescript
function useTimezoneDetection(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Failed to detect timezone, falling back to UTC', error);
    return 'UTC';
  }
}
```

**Recovery:**
- Timestamps displayed in UTC
- Metrics fetched with timezone=UTC
- No user-facing error, graceful degradation

---

### Error 6: Authentication Error (401 Unauthorized)

**Scenario:** JWT cookie expired or invalid, API returns 401

**Handling:**
- Global error interceptor in TanStack Query
- Clear authentication state
- Redirect to landing page

**Component:** Global query error handler

**Implementation:**
```typescript
// In QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        if (error.status === 401) {
          window.location.href = '/';
        }
      },
    },
  },
});
```

**Recovery:**
- User redirected to landing page
- Must sign in again with Google OAuth

## 11. Implementation Steps

### Step 1: Set Up Type Definitions
1. Verify existing types in `@gsd/types` package (DoneTaskDto, GetDoneResponseDto, metrics types)
2. Create new view model types in `apps/frontend/src/types/done.ts`:
   - MetricsSummary
   - TimestampDisplay
   - PaginationInfo
3. Export types from types index file

### Step 2: Create Custom Hooks
1. Create `apps/frontend/src/hooks/useTimezoneDetection.ts`
   - Implement Intl.DateTimeFormat timezone detection with UTC fallback
2. Create `apps/frontend/src/hooks/useRelativeTime.ts`
   - Implement relative/absolute timestamp formatting using date-fns
   - Add 7-day threshold logic
3. Create `apps/frontend/src/hooks/usePagination.ts`
   - Implement pagination state calculation
   - Return PaginationInfo object
4. Create `apps/frontend/src/hooks/useDoneTasksQuery.ts`
   - Implement TanStack Query hook for fetching paginated tasks
   - Configure caching, retries, error handling
5. Create `apps/frontend/src/hooks/useMetricsQuery.ts`
   - Implement TanStack Query hook for fetching daily/weekly metrics
   - Compute MetricsSummary from API responses
   - Use date-fns for date range calculations (startOfWeek, endOfWeek, subWeeks)

### Step 3: Create Utility Components
1. Create `apps/frontend/src/components/done/TaskColorIndicator.tsx`
   - Render 4px left border with origin backlog color
2. Create `apps/frontend/src/components/done/CompletionTimestamp.tsx`
   - Use useRelativeTime hook
   - Render <time> element with datetime attribute
   - Add tooltip with both relative and absolute times (using shadcn/ui Tooltip)
3. Create `apps/frontend/src/components/done/MetricBadge.tsx`
   - Render icon, label, and count
   - Use lucide-react icons (CheckCircle, Calendar)
4. Create `apps/frontend/src/components/done/EmptyDoneState.tsx`
   - Render centered empty state with icon, heading, description, CTA button
   - Handle navigation to Work Mode

### Step 4: Create Task Display Components
1. Create `apps/frontend/src/components/done/CompletedTaskCard.tsx`
   - Import and use TaskColorIndicator, CompletionTimestamp
   - Render task title (bold), description (truncated), timestamp
   - Apply Tailwind styling (border, padding, rounded corners)
   - Add hover state (bg-gray-50)
2. Create `apps/frontend/src/components/done/CompletedTaskList.tsx`
   - Render semantic <ul> element
   - Map tasks array to CompletedTaskCard components (<li>)
   - Handle loading state (skeleton loaders)
   - Handle empty state (EmptyDoneState)
   - Handle error state (error message with retry button)

### Step 5: Create Metrics Components
1. Create `apps/frontend/src/components/done/MetricsHeader.tsx`
   - Use useMetricsQuery hook to fetch data
   - Render three MetricBadge components (Today, This Week, Last Week)
   - Display timezone indicator (subtle text, right-aligned)
   - Handle loading state (skeleton badges)
   - Handle error state (hide or show subtle error)

### Step 6: Create Pagination Components
1. Create `apps/frontend/src/components/done/PaginationControls.tsx`
   - Use usePagination hook to compute state
   - Render Previous button (disabled if hasPreviousPage is false)
   - Render page number buttons with truncation logic (if totalPages > 7)
   - Render Next button (disabled if hasNextPage is false)
   - Render results count text ("Showing X-Y of Z")
   - Apply ARIA attributes (aria-current, aria-disabled, aria-label)
   - Handle onPageChange callback

### Step 7: Implement Main DoneView Component
1. Update `apps/frontend/src/components/views/DoneView.tsx`
   - Import all sub-components and hooks
   - Set up local state: currentPage (read from URL, default 1)
   - Use useTimezoneDetection hook
   - Use useDoneTasksQuery(currentPage) and useMetricsQuery() hooks
   - Add useEffect to sync currentPage with URL (?page parameter)
   - Add useEffect to validate currentPage against totalPages
   - Render layout:
     - AppHeader (pass currentMode="done")
     - MetricsHeader (pass metrics data)
     - CompletedTaskList (pass tasks data)
     - PaginationControls (pass pagination props and onPageChange handler)

### Step 8: Implement URL Synchronization
1. In DoneView component, add useEffect to sync URL:
   ```typescript
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     params.set('page', currentPage.toString());
     window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
   }, [currentPage]);
   ```
2. Add useEffect to validate page number:
   ```typescript
   useEffect(() => {
     if (tasksData && currentPage > Math.ceil(tasksData.total / tasksData.limit)) {
       setCurrentPage(1);
     }
   }, [tasksData, currentPage]);
   ```

### Step 9: Add Skeleton Loaders
1. Create `apps/frontend/src/components/done/MetricsHeaderSkeleton.tsx`
   - Render three skeleton badges (gray rectangles with shimmer animation)
2. Create `apps/frontend/src/components/done/TaskListSkeleton.tsx`
   - Render 10 skeleton task cards (gray rectangles with shimmer)
3. Use these in MetricsHeader and CompletedTaskList during loading states

### Step 10: Add Error Handling
1. In CompletedTaskList, add error state rendering:
   ```typescript
   if (error) {
     return (
       <div className="text-center py-12">
         <p className="text-red-600">{error.message}</p>
         <button onClick={onRetry}>Retry</button>
       </div>
     );
   }
   ```
2. In MetricsHeader, add error state handling (hide or show subtle error)
3. In useDoneTasksQuery and useMetricsQuery, configure TanStack Query error handling

### Step 11: Add Accessibility Features
1. Add ARIA attributes to PaginationControls:
   - aria-label="Pagination" on <nav>
   - aria-current="page" on current page button
   - aria-disabled="true" on disabled buttons
2. Add semantic HTML:
   - <ul> for task list
   - <li> for each task card
   - <time> for timestamps with datetime attribute
   - <h2> for section headings
3. Add screen reader announcements:
   - "Completed tasks list, X items" on CompletedTaskList
   - "Today: X tasks" on metric badges
4. Test keyboard navigation (Tab through pagination controls)

### Step 12: Add Mobile Responsiveness
1. Update MetricsHeader to stack vertically on mobile (use Tailwind responsive classes)
2. Update PaginationControls to simplify on mobile:
   - Show only [< Prev] [Page X of Y] [Next >]
   - Hide individual page number buttons
3. Update CompletedTaskCard to adjust padding/spacing on mobile
4. Test on mobile viewport (Chrome DevTools device emulation)

### Step 13: Test and Refine
1. Manual testing:
   - Navigate to /app/done
   - Verify metrics display correctly (today, this week, last week counts)
   - Verify task list displays 50 items
   - Navigate between pages
   - Verify timestamps display relative/absolute correctly
   - Verify empty state when no tasks
   - Verify error states (disconnect network, test error handling)
2. Cross-browser testing:
   - Chrome, Firefox, Safari
   - Test timezone detection
   - Test date formatting
3. Accessibility testing:
   - Screen reader (VoiceOver, NVDA)
   - Keyboard-only navigation
   - Color contrast (WCAG AA)
4. Performance testing:
   - Test with 500 tasks (max retention)
   - Verify pagination performs well
   - Check TanStack Query caching (Network tab)

### Step 14: Integration with App Shell
1. Verify AppHeader integration:
   - currentMode="done" prop passed correctly
   - Mode switcher highlights "Done"
2. Verify keyboard shortcuts:
   - Cmd+Shift+A navigates to Done Archive (configured in App.tsx or AppShell)
3. Verify React Router route:
   - /app/done route configured in App.tsx
   - DoneView component rendered

### Step 15: Documentation and Cleanup
1. Add JSDoc comments to complex functions (useMetricsQuery, pagination logic)
2. Update .ai/project-tracker.md:
   - Mark Done Archive view as completed
   - Update progress percentages
3. Create PR with detailed description:
   - List all components created
   - Describe API integration
   - Note any design decisions (e.g., 7-day threshold for relative time)
4. Add screenshots to PR (metrics header, task list, pagination, empty state)

---

## Summary

This implementation plan provides a comprehensive blueprint for building the Done Archive view. The view is read-only and focused on displaying completed tasks with metrics, leveraging TanStack Query for data fetching, date-fns for timezone handling, and shadcn/ui components for consistent styling. Key features include:

- **Metrics Header**: Displays today's, this week's, and last week's task completion counts
- **Paginated Task List**: Shows 50 tasks per page in reverse chronological order with timestamps
- **Timezone Support**: Automatically detects user's timezone and formats timestamps accordingly
- **Relative/Absolute Time**: Shows "2 hours ago" for recent tasks, "Jan 5, 2025 3:42 PM" for older tasks
- **Pagination Controls**: Navigate between pages with Previous/Next and page number buttons
- **Empty State**: Encourages users to complete tasks when archive is empty
- **Error Handling**: Graceful degradation for network errors with retry options
- **Accessibility**: Semantic HTML, ARIA attributes, keyboard navigation, screen reader support
- **Mobile Responsive**: Adapts layout for mobile viewports

Implementation follows React best practices with small, focused components (max 50-80 lines), custom hooks for reusable logic, and TypeScript for type safety. All API interactions are typed using shared DTOs from @gsd/types package, ensuring consistency between frontend and backend.
