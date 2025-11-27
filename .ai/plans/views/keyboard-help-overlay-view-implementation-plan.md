# View Implementation Plan: Keyboard Help Overlay

## 1. Overview

The Keyboard Help Overlay is a modal component that displays a comprehensive, categorized list of keyboard shortcuts available throughout the GSD application. It is accessible from any authenticated view by pressing the "?" key and provides search/filter functionality to help users discover and learn keyboard shortcuts. The overlay categorizes shortcuts into three contexts: Global (available everywhere), Plan Mode (specific to plan view), and Work Mode (specific to work view). This component is essential for the keyboard-first interaction model of GSD, providing discoverability and learning support for users.

## 2. View Routing

**View Path:** N/A (Modal overlay, not a route)

**Trigger:**
- Keyboard shortcut: "?" key from any authenticated view (`/app/*`)
- Can also be triggered from Command Palette or Help menu button

**Parent Context:**
- Rendered within `<AppShell>` or global modal portal
- Available in Plan Mode, Work Mode, and Done Archive views

## 3. Component Structure

```
<KeyboardHelpModal>
  └─ <Dialog> (shadcn/ui)
      └─ <DialogOverlay>
          └─ <DialogContent>
              ├─ <DialogHeader>
              │   ├─ <DialogTitle>
              │   └─ <DialogClose> (X button)
              ├─ <SearchInput>
              └─ <ScrollableContent>
                  ├─ <ShortcutCategorySection category="Global Shortcuts">
                  │   ├─ <ShortcutRow>
                  │   │   ├─ <KeyBadgeGroup>
                  │   │   │   ├─ <KeyBadge>Cmd</KeyBadge>
                  │   │   │   └─ <KeyBadge>P</KeyBadge>
                  │   │   └─ <ShortcutDescription>
                  │   └─ ... (more ShortcutRow components)
                  ├─ <ShortcutCategorySection category="Plan Mode Shortcuts">
                  │   └─ ... (ShortcutRow components)
                  ├─ <ShortcutCategorySection category="Work Mode Shortcuts">
                  │   └─ ... (ShortcutRow components)
                  └─ <EmptyState> (shown when no search results)
```

## 4. Component Details

### KeyboardHelpModal

- **Component description:** Root modal component that manages the keyboard help overlay. Handles open/close state, keyboard event listeners (? and Esc keys), and provides context for all child components. Uses shadcn/ui Dialog component for accessibility and focus management.

- **Main elements:**
  - `<Dialog>` wrapper from shadcn/ui with `isOpen` prop
  - `<DialogOverlay>` with semi-transparent dark background
  - `<DialogContent>` centered card container (max-width: 800px desktop, full-screen mobile)
  - Focus trap implementation (built into Dialog)
  - Portal rendering to body element

- **Handled interactions:**
  - Escape key press → calls `onClose()`
  - Click outside overlay → calls `onClose()`
  - "?" key press (global listener) → toggles modal open/close state

- **Handled validation:** None (read-only component)

- **Types:**
  - `KeyboardHelpModalProps` (component props)
  - `ShortcutData` (shortcut data structure)

- **Props:**
  ```typescript
  interface KeyboardHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
  }
  ```

### DialogHeader

- **Component description:** Header section of the modal containing the title and close button. Provides consistent spacing and layout for modal header elements.

- **Main elements:**
  - `<DialogTitle>` with "Keyboard Shortcuts" text (semantic h2)
  - `<DialogClose>` button (X icon from lucide-react) in top-right corner
  - Flexbox layout with space-between alignment

- **Handled interactions:**
  - Close button click → calls `onClose()`

- **Handled validation:** None

- **Types:** None (uses shadcn/ui Dialog component types)

- **Props:** None (receives context from parent Dialog)

### SearchInput

- **Component description:** Text input field for filtering shortcuts by keyword. Performs real-time case-insensitive search across shortcut descriptions and key names.

- **Main elements:**
  - `<Input>` component from shadcn/ui
  - Search icon (lucide-react) as prefix
  - Clear button (X icon) when input has value
  - Placeholder text: "Search shortcuts..."

- **Handled interactions:**
  - Text input → updates `searchQuery` state
  - Clear button click → resets `searchQuery` to empty string
  - Focus on modal open (auto-focused)

- **Handled validation:**
  - Max length: 100 characters (prevent excessively long queries)
  - Trim whitespace for search matching

- **Types:**
  - `string` for search query state

- **Props:**
  ```typescript
  interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
  }
  ```

### ScrollableContent

- **Component description:** Scrollable container for shortcut categories. Ensures content doesn't overflow modal height and provides smooth scrolling experience.

- **Main elements:**
  - `<div>` with `overflow-y: auto` and max-height calculation
  - Custom scrollbar styling (Tailwind scrollbar utilities)
  - Padding for visual spacing

- **Handled interactions:**
  - Mouse wheel scroll
  - Keyboard scroll (Page Up/Down, Home/End)
  - Touch scroll on mobile

- **Handled validation:** None

- **Types:** None

- **Props:**
  ```typescript
  interface ScrollableContentProps {
    children: React.ReactNode;
  }
  ```

### ShortcutCategorySection

- **Component description:** Container for a group of related shortcuts (Global, Plan Mode, or Work Mode). Displays category heading and renders all shortcuts within that category. Hidden if category has no matching shortcuts after filtering.

- **Main elements:**
  - Category heading (`<h3>`) with category name
  - Divider line below heading
  - List of `<ShortcutRow>` components
  - Conditional rendering based on filtered shortcuts

- **Handled interactions:** None (presentational)

- **Handled validation:**
  - Only renders if `shortcuts.length > 0`
  - Filters shortcuts based on category match

- **Types:**
  - `ShortcutData[]` for shortcuts array
  - `string` for category name

- **Props:**
  ```typescript
  interface ShortcutCategorySectionProps {
    category: string;
    shortcuts: ShortcutData[];
  }
  ```

### ShortcutRow

- **Component description:** Individual row displaying a single keyboard shortcut with its key combination(s) and description. Shows primary keys on left and description on right, with optional alternate keys displayed below.

- **Main elements:**
  - Flex container with two columns (keys left, description right)
  - `<KeyBadgeGroup>` for primary key combination
  - `<ShortcutDescription>` for action description
  - Optional alternate keys section (e.g., "or h j k l" for vim-style)
  - Hover state with subtle background color

- **Handled interactions:**
  - Hover → subtle background highlight

- **Handled validation:** None

- **Types:**
  - `ShortcutData` for shortcut data

- **Props:**
  ```typescript
  interface ShortcutRowProps {
    keys: string[];
    description: string;
    alternateKeys?: string[][];
  }
  ```

### KeyBadgeGroup

- **Component description:** Container for multiple KeyBadge components representing a key combination (e.g., Cmd + P). Handles spacing and "+" separators between keys.

- **Main elements:**
  - Flex container with gap spacing
  - Multiple `<KeyBadge>` components
  - "+" separator text between keys (subtle color)

- **Handled interactions:** None (presentational)

- **Handled validation:** None

- **Types:**
  - `string[]` for keys array

- **Props:**
  ```typescript
  interface KeyBadgeGroupProps {
    keys: string[];
  }
  ```

### KeyBadge

- **Component description:** Visual representation of a single keyboard key. Styled as a rounded badge with border and subtle shadow to resemble a physical key.

- **Main elements:**
  - `<kbd>` semantic HTML element
  - Platform-specific key name (Cmd on Mac, Ctrl on Windows/Linux)
  - Optional symbol rendering (⌘, ⌃, ⇧, ⌥) for better visual recognition
  - Minimum width for consistency
  - Monospace font for key names

- **Handled interactions:** None (presentational)

- **Handled validation:**
  - Key name normalization (e.g., "Command" → "Cmd")
  - Platform detection for Cmd vs Ctrl

- **Types:**
  - `string` for key name

- **Props:**
  ```typescript
  interface KeyBadgeProps {
    keyName: string;
    variant?: 'default' | 'symbol'; // Display text or symbol
  }
  ```

### ShortcutDescription

- **Component description:** Text description of what a keyboard shortcut does. Provides clear, concise action description.

- **Main elements:**
  - `<span>` with descriptive text
  - Readable font size (base or text-sm)
  - Text color with good contrast

- **Handled interactions:** None (presentational)

- **Handled validation:** None

- **Types:**
  - `string` for description text

- **Props:**
  ```typescript
  interface ShortcutDescriptionProps {
    children: React.ReactNode;
  }
  ```

### EmptyState

- **Component description:** Displayed when search query yields no matching shortcuts. Provides user feedback and suggests clearing the search.

- **Main elements:**
  - Centered container
  - Icon (Search X or Info icon)
  - Message: "No shortcuts found for '[query]'"
  - Suggestion text: "Try a different search term or clear the search"

- **Handled interactions:** None (presentational)

- **Handled validation:** None

- **Types:** None

- **Props:**
  ```typescript
  interface EmptyStateProps {
    searchQuery: string;
  }
  ```

## 5. Types

### ShortcutData

Main data structure for keyboard shortcuts. Represents a single shortcut with its key combination, description, and category.

```typescript
interface ShortcutData {
  /** Array of key names forming the shortcut (e.g., ['Cmd', 'P']) */
  keys: string[];

  /** Human-readable description of what the shortcut does */
  description: string;

  /** Category context where this shortcut is available */
  category: 'global' | 'plan' | 'work';

  /** Optional alternate key combinations (e.g., vim-style alternatives) */
  alternateKeys?: string[][];

  /** Optional search keywords for better filtering */
  searchKeywords?: string[];
}
```

**Example:**
```typescript
const exampleShortcut: ShortcutData = {
  keys: ['Cmd', 'P'],
  description: 'Switch to Plan Mode',
  category: 'global',
  searchKeywords: ['plan', 'mode', 'switch', 'navigate']
};
```

### KeyboardHelpModalProps

Props for the root modal component. Controls open/close state.

```typescript
interface KeyboardHelpModalProps {
  /** Controls modal visibility */
  isOpen: boolean;

  /** Callback fired when modal should close */
  onClose: () => void;
}
```

### ShortcutCategorySectionProps

Props for category section component. Groups shortcuts by context.

```typescript
interface ShortcutCategorySectionProps {
  /** Category display name (e.g., "Global Shortcuts") */
  category: string;

  /** Array of shortcuts to display in this category */
  shortcuts: ShortcutData[];
}
```

### ShortcutRowProps

Props for individual shortcut row. Displays single shortcut with keys and description.

```typescript
interface ShortcutRowProps {
  /** Array of key names (e.g., ['Cmd', 'K']) */
  keys: string[];

  /** Description of what the shortcut does */
  description: string;

  /** Optional alternate key combinations */
  alternateKeys?: string[][];
}
```

### KeyBadgeProps

Props for keyboard key badge. Visual representation of a key.

```typescript
interface KeyBadgeProps {
  /** Name of the key (e.g., 'Cmd', 'Enter', 'Arrow Up') */
  keyName: string;

  /** Display variant: 'default' shows text, 'symbol' shows symbols like ⌘ */
  variant?: 'default' | 'symbol';
}
```

### KeyBadgeGroupProps

Props for group of key badges. Represents a key combination.

```typescript
interface KeyBadgeGroupProps {
  /** Array of key names forming a combination */
  keys: string[];
}
```

### Platform Type

Enumeration for platform detection (used for Cmd vs Ctrl display).

```typescript
type Platform = 'mac' | 'windows' | 'linux';
```

## 6. State Management

### Component State (Local)

**KeyboardHelpModal Component:**

```typescript
const [searchQuery, setSearchQuery] = useState<string>('');
const [filteredShortcuts, setFilteredShortcuts] = useState<ShortcutData[]>([]);
```

- `searchQuery`: Current search input value (empty string by default)
- `filteredShortcuts`: Computed array of shortcuts matching search query

**State Updates:**
- `searchQuery` updated on input change (controlled input)
- `filteredShortcuts` computed via `useMemo` based on `searchQuery` and static shortcuts data

### Global State

None required. Modal open/close state is managed by parent component (AppShell or layout component).

### Custom Hooks

**useKeyboardShortcuts()**

Returns the static array of all keyboard shortcuts. Memoized to prevent re-computation.

```typescript
function useKeyboardShortcuts(): ShortcutData[] {
  return useMemo(() => KEYBOARD_SHORTCUTS, []);
}
```

**useFilteredShortcuts(query: string)**

Filters shortcuts based on search query. Searches across keys, descriptions, and optional search keywords. Case-insensitive matching.

```typescript
function useFilteredShortcuts(query: string, shortcuts: ShortcutData[]): ShortcutData[] {
  return useMemo(() => {
    if (!query.trim()) return shortcuts;

    const lowerQuery = query.toLowerCase().trim();

    return shortcuts.filter(shortcut => {
      // Search in description
      if (shortcut.description.toLowerCase().includes(lowerQuery)) return true;

      // Search in keys
      if (shortcut.keys.some(key => key.toLowerCase().includes(lowerQuery))) return true;

      // Search in optional keywords
      if (shortcut.searchKeywords?.some(kw => kw.toLowerCase().includes(lowerQuery))) return true;

      return false;
    });
  }, [query, shortcuts]);
}
```

**usePlatform()**

Detects user's platform (Mac, Windows, Linux) for displaying correct modifier keys (Cmd vs Ctrl).

```typescript
function usePlatform(): Platform {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'windows';

    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('win')) return 'windows';
    return 'linux';
  }, []);
}
```

### Keyboard Event Handling

**Global "?" Key Listener (in AppShell or parent component):**

```typescript
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    // Only trigger if not in input/textarea and not composing (IME)
    const isInInput = ['INPUT', 'TEXTAREA'].includes(
      (event.target as HTMLElement).tagName
    );

    if (event.key === '?' && !isInInput && !event.isComposing) {
      event.preventDefault();
      setIsHelpModalOpen(prev => !prev); // Toggle modal
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

**Escape Key Listener (handled by shadcn/ui Dialog):**

The Dialog component automatically handles Escape key to close the modal.

## 7. API Integration

**No API integration required.** This is a purely frontend component with static data.

All keyboard shortcuts are defined as a constant array in the frontend:

```typescript
const KEYBOARD_SHORTCUTS: ShortcutData[] = [
  // Global Shortcuts
  { keys: ['Cmd', 'P'], description: 'Switch to Plan Mode', category: 'global' },
  { keys: ['Cmd', 'W'], description: 'Switch to Work Mode', category: 'global' },
  { keys: ['Cmd', 'Shift', 'A'], description: 'Switch to Done Archive', category: 'global' },
  { keys: ['Cmd', 'Shift', 'D'], description: 'Open Dump Mode', category: 'global' },
  { keys: ['Cmd', 'K'], description: 'Open Command Palette', category: 'global' },
  { keys: ['?'], description: 'Show Keyboard Shortcuts', category: 'global' },

  // Plan Mode Shortcuts
  { keys: ['↑'], description: 'Navigate up', category: 'plan', alternateKeys: [['k']] },
  { keys: ['↓'], description: 'Navigate down', category: 'plan', alternateKeys: [['j']] },
  { keys: ['←'], description: 'Navigate left', category: 'plan', alternateKeys: [['h']] },
  { keys: ['→'], description: 'Navigate right', category: 'plan', alternateKeys: [['l']] },
  { keys: ['n'], description: 'Create new task', category: 'plan' },
  { keys: ['e'], description: 'Edit selected task', category: 'plan', alternateKeys: [['Enter']] },
  { keys: ['l'], description: 'Create new list', category: 'plan' },
  { keys: ['Delete'], description: 'Delete selected item', category: 'plan', alternateKeys: [['Backspace']] },
  { keys: ['Cmd', '↑'], description: 'Move task up', category: 'plan' },
  { keys: ['Cmd', '↓'], description: 'Move task down', category: 'plan' },
  { keys: ['m'], description: 'Move task to another list', category: 'plan' },
  { keys: ['Space'], description: 'Complete selected task', category: 'plan' },

  // Work Mode Shortcuts
  { keys: ['Space'], description: 'Complete current task', category: 'work', alternateKeys: [['Enter']] },
  { keys: ['n'], description: 'Add new task', category: 'work' },
];
```

## 8. User Interactions

### Opening the Modal

**Trigger:** User presses "?" key from any authenticated view

**Flow:**
1. User presses "?" key while not focused in an input field
2. Global keyboard event listener in AppShell detects keypress
3. Event handler checks if target is not an input/textarea
4. `setIsHelpModalOpen(true)` is called
5. `KeyboardHelpModal` component renders with `isOpen={true}`
6. Dialog overlay appears with fade-in animation
7. Focus automatically moves to search input (auto-focus)
8. Screen reader announces: "Keyboard Shortcuts dialog"

**Expected Outcome:** Modal appears, search input is focused, all shortcuts are visible

### Searching for Shortcuts

**Trigger:** User types in search input field

**Flow:**
1. User types characters in search input
2. `onChange` handler updates `searchQuery` state on every keystroke
3. `useFilteredShortcuts` hook recomputes filtered shortcuts
4. Categories re-render with filtered shortcuts
5. Categories with no matching shortcuts are hidden
6. If no shortcuts match, `EmptyState` component is shown
7. Filtering is case-insensitive and searches keys, descriptions, and keywords

**Expected Outcome:**
- Matching shortcuts are displayed, grouped by category
- Non-matching shortcuts are hidden
- Categories with no matches are hidden
- Empty state shown if zero matches

**Example Searches:**
- "plan" → Shows all shortcuts related to Plan Mode
- "delete" → Shows Delete and Backspace shortcuts
- "cmd p" → Shows "Switch to Plan Mode" shortcut
- "xyz123" → Shows empty state

### Clearing Search

**Trigger:** User clicks clear button (X icon) in search input

**Flow:**
1. User clicks clear button
2. `onClear` handler sets `searchQuery` to empty string
3. `useFilteredShortcuts` returns all shortcuts
4. All categories and shortcuts become visible again
5. Focus returns to search input

**Expected Outcome:** All shortcuts visible, search input cleared

### Browsing Shortcuts

**Trigger:** User scrolls or navigates through shortcuts

**Flow:**
1. User uses mouse wheel, trackpad, or keyboard to scroll
2. `ScrollableContent` container scrolls vertically
3. Custom scrollbar provides visual feedback
4. Categories remain in view as user scrolls
5. User can read key combinations and descriptions

**Expected Outcome:** Smooth scrolling, all shortcuts accessible

### Closing the Modal

**Multiple Methods:**

1. **Press "?" key again:**
   - Global listener toggles modal state
   - Modal closes with fade-out animation
   - Focus returns to previous element

2. **Press Escape key:**
   - Dialog component's built-in handler triggers
   - `onClose()` callback is called
   - Modal closes

3. **Click X button:**
   - Close button click handler calls `onClose()`
   - Modal closes

4. **Click outside modal (on overlay):**
   - Dialog overlay click handler triggers
   - `onClose()` callback is called
   - Modal closes

**Expected Outcome:** Modal closes, focus returns to previous element, modal state resets (search query cleared)

### Keyboard Navigation Within Modal

**Trigger:** User presses Tab or Shift+Tab

**Flow:**
1. User presses Tab
2. Focus moves to next focusable element (search input → close button → back to search)
3. Focus trap prevents tabbing outside modal
4. Visual focus indicator follows focus
5. User can activate elements with Enter/Space

**Expected Outcome:** Focus cycles within modal, cannot escape to background

## 9. Conditions and Validation

### Rendering Conditions

**Modal Visibility:**
- Modal only renders when `isOpen === true`
- Controlled by parent component state
- Portal renders to document body

**Category Visibility:**
- Category section renders only if `shortcuts.length > 0` for that category
- After filtering, empty categories are hidden
- Condition: `filteredShortcuts.filter(s => s.category === 'global').length > 0`

**Empty State Visibility:**
- Empty state renders only if:
  - `searchQuery.trim() !== ''` (user has searched)
  - AND `filteredShortcuts.length === 0` (no matches found)

**Clear Button Visibility:**
- Clear button in search input renders only if `searchQuery.length > 0`

### Search Filtering Logic

**Case-Insensitive Matching:**
```typescript
const lowerQuery = query.toLowerCase().trim();
const matches = shortcut.description.toLowerCase().includes(lowerQuery);
```

**Multi-Field Search:**
- Searches in: description, keys array, optional searchKeywords array
- Returns true if ANY field contains the query
- Partial matching allowed (e.g., "del" matches "Delete")

### Input Validation

**Search Input:**
- Max length: 100 characters (enforced by `maxLength` attribute)
- Trim whitespace for search matching
- Allow all characters (no sanitization needed for display-only component)

**No other validation needed** - Component is read-only and doesn't submit data

### Platform-Specific Display

**Modifier Key Display:**
```typescript
const modifierKey = platform === 'mac' ? 'Cmd' : 'Ctrl';
```

- Mac users see: "Cmd"
- Windows/Linux users see: "Ctrl"
- Detected via `navigator.platform`

**Symbol Display (Optional Enhancement):**
- Cmd → ⌘
- Ctrl → ⌃
- Shift → ⇧
- Alt/Option → ⌥
- Only used if `variant="symbol"` prop is set

### Accessibility Conditions

**Focus Trap:**
- Active only when modal is open
- Focus must stay within modal
- First focusable element (search input) receives focus on open

**ARIA Attributes:**
- Dialog has `role="dialog"`
- Dialog has `aria-modal="true"`
- Dialog title has unique ID referenced by `aria-labelledby`
- Search input has `aria-label="Search keyboard shortcuts"`

**Screen Reader Announcements:**
- Modal open announced: "Keyboard Shortcuts dialog"
- Search results count announced: "[X] shortcuts found" (via aria-live region)
- Empty state announced: "No shortcuts found"

## 10. Error Handling

### No API Errors

Since this component doesn't make API calls, there are no network errors to handle.

### Edge Cases

**1. Empty Shortcuts Data**

**Scenario:** `KEYBOARD_SHORTCUTS` array is empty (should never happen in production)

**Handling:**
- Display message: "No keyboard shortcuts available"
- Provide link to documentation or support

**2. Very Long Search Query**

**Scenario:** User attempts to enter >100 characters in search input

**Handling:**
- Input `maxLength={100}` attribute prevents entry
- Visual feedback: character count indicator (optional)

**3. No Search Results**

**Scenario:** Search query doesn't match any shortcuts

**Handling:**
- Display `EmptyState` component with helpful message
- Suggest clearing search or trying different terms
- List popular shortcuts as suggestions (optional enhancement)

**4. Mobile Viewport Constraints**

**Scenario:** Modal height exceeds mobile viewport

**Handling:**
- Modal becomes full-screen on mobile (Tailwind: `sm:max-w-[800px]`)
- `ScrollableContent` has max-height calculation based on viewport
- Content scrolls vertically within modal

**5. Keyboard Event Conflicts**

**Scenario:** "?" key pressed while typing in an input field elsewhere

**Handling:**
```typescript
const isInInput = ['INPUT', 'TEXTAREA'].includes(
  (event.target as HTMLElement).tagName
);

if (event.key === '?' && !isInInput && !event.isComposing) {
  // Only trigger modal if not in input
}
```

**6. Focus Management Failure**

**Scenario:** Focus doesn't return to previous element on close

**Handling:**
- shadcn/ui Dialog component handles focus return automatically
- If custom implementation needed, store previous `document.activeElement` on open
- Restore focus on close: `previousElement?.focus()`

**7. Platform Detection Failure**

**Scenario:** Cannot detect user's platform for Cmd vs Ctrl

**Handling:**
- Default to "Ctrl" if detection fails
- Provide manual toggle in settings (post-MVP)

### Console Warnings (Development)

**Potential warnings:**
- Missing key prop in mapped arrays → Ensure unique keys for each `<ShortcutRow>`
- Focus trap warnings → Verify shadcn/ui Dialog configuration

**No user-facing error states** are needed for this component.

## 11. Implementation Steps

### Step 1: Create Shortcut Data Structure

1. Create `/apps/frontend/src/data/keyboard-shortcuts.ts`
2. Define `ShortcutData` interface
3. Export `KEYBOARD_SHORTCUTS` constant array with all shortcuts
4. Organize by category (global, plan, work)
5. Include alternate keys where applicable (vim-style)
6. Add optional searchKeywords for better filtering

**Deliverable:** Static shortcuts data file

---

### Step 2: Create Utility Hooks

1. Create `/apps/frontend/src/hooks/useKeyboardShortcuts.ts`
   - Implement `useKeyboardShortcuts()` hook (returns static data)
   - Export hook

2. Create `/apps/frontend/src/hooks/useFilteredShortcuts.ts`
   - Implement `useFilteredShortcuts(query, shortcuts)` hook
   - Use `useMemo` for performance
   - Implement case-insensitive search across multiple fields
   - Export hook

3. Create `/apps/frontend/src/hooks/usePlatform.ts`
   - Implement `usePlatform()` hook (detects Mac/Windows/Linux)
   - Use `useMemo` to cache result
   - Export hook

**Deliverable:** Three custom hooks for shortcuts management

---

### Step 3: Create KeyBadge Component

1. Create `/apps/frontend/src/components/KeyboardHelp/KeyBadge.tsx`
2. Define `KeyBadgeProps` interface
3. Implement semantic `<kbd>` element
4. Style with Tailwind: rounded, border, subtle shadow, monospace font
5. Handle platform-specific key names (Cmd vs Ctrl)
6. Optional: Add symbol variant (⌘, ⌃, etc.)
7. Export component

**Styling:**
```tsx
<kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-xs font-mono font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm">
  {keyName}
</kbd>
```

**Deliverable:** Reusable KeyBadge component

---

### Step 4: Create KeyBadgeGroup Component

1. Create `/apps/frontend/src/components/KeyboardHelp/KeyBadgeGroup.tsx`
2. Define `KeyBadgeGroupProps` interface
3. Render array of `<KeyBadge>` components with "+" separators
4. Use flexbox layout with gap spacing
5. Export component

**Example:**
```tsx
<div className="flex items-center gap-1">
  {keys.map((key, index) => (
    <React.Fragment key={key}>
      <KeyBadge keyName={key} />
      {index < keys.length - 1 && <span className="text-gray-400 text-xs">+</span>}
    </React.Fragment>
  ))}
</div>
```

**Deliverable:** KeyBadgeGroup component

---

### Step 5: Create ShortcutDescription Component

1. Create `/apps/frontend/src/components/KeyboardHelp/ShortcutDescription.tsx`
2. Simple text component with appropriate styling
3. Ensure good readability (font size, color, line height)
4. Export component

**Styling:**
```tsx
<span className="text-sm text-gray-700 dark:text-gray-300">
  {children}
</span>
```

**Deliverable:** ShortcutDescription component

---

### Step 6: Create ShortcutRow Component

1. Create `/apps/frontend/src/components/KeyboardHelp/ShortcutRow.tsx`
2. Define `ShortcutRowProps` interface
3. Implement two-column layout (keys left, description right)
4. Render `<KeyBadgeGroup>` and `<ShortcutDescription>`
5. Add hover state styling
6. Optionally display alternate keys below primary keys
7. Export component

**Layout:**
```tsx
<div className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors">
  <KeyBadgeGroup keys={keys} />
  <ShortcutDescription>{description}</ShortcutDescription>
</div>
```

**Deliverable:** ShortcutRow component

---

### Step 7: Create ShortcutCategorySection Component

1. Create `/apps/frontend/src/components/KeyboardHelp/ShortcutCategorySection.tsx`
2. Define `ShortcutCategorySectionProps` interface
3. Render category heading (`<h3>`)
4. Add divider below heading
5. Map through shortcuts array and render `<ShortcutRow>` for each
6. Conditionally render only if `shortcuts.length > 0`
7. Export component

**Example:**
```tsx
{shortcuts.length > 0 && (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{category}</h3>
    <div className="border-b border-gray-200 mb-3" />
    <div className="space-y-1">
      {shortcuts.map((shortcut, index) => (
        <ShortcutRow key={index} {...shortcut} />
      ))}
    </div>
  </div>
)}
```

**Deliverable:** ShortcutCategorySection component

---

### Step 8: Create EmptyState Component

1. Create `/apps/frontend/src/components/KeyboardHelp/EmptyState.tsx`
2. Define `EmptyStateProps` interface (accepts `searchQuery`)
3. Display centered message with icon
4. Provide helpful suggestions
5. Export component

**Example:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <SearchX className="w-12 h-12 text-gray-400 mb-3" />
  <p className="text-gray-700 font-medium mb-1">
    No shortcuts found for "{searchQuery}"
  </p>
  <p className="text-sm text-gray-500">
    Try a different search term or clear the search
  </p>
</div>
```

**Deliverable:** EmptyState component

---

### Step 9: Create SearchInput Component

1. Create `/apps/frontend/src/components/KeyboardHelp/SearchInput.tsx`
2. Use shadcn/ui `<Input>` component
3. Add search icon prefix (lucide-react)
4. Add clear button (X icon) when input has value
5. Handle `value`, `onChange`, and `onClear` props
6. Add auto-focus on mount
7. Export component

**Example:**
```tsx
<div className="relative mb-4">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <Input
    type="text"
    placeholder="Search shortcuts..."
    value={value}
    onChange={(e) => onChange(e.target.value)}
    maxLength={100}
    autoFocus
    className="pl-10 pr-10"
  />
  {value && (
    <button
      onClick={onClear}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      <X className="w-4 h-4" />
    </button>
  )}
</div>
```

**Deliverable:** SearchInput component with clear functionality

---

### Step 10: Create ScrollableContent Component

1. Create `/apps/frontend/src/components/KeyboardHelp/ScrollableContent.tsx`
2. Implement scrollable container with max-height calculation
3. Style custom scrollbar (Tailwind scrollbar utilities)
4. Export component

**Styling:**
```tsx
<div className="overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
  {children}
</div>
```

**Deliverable:** ScrollableContent wrapper component

---

### Step 11: Create KeyboardHelpModal Component

1. Create `/apps/frontend/src/components/KeyboardHelp/KeyboardHelpModal.tsx`
2. Import shadcn/ui Dialog components
3. Define `KeyboardHelpModalProps` interface
4. Implement local state for `searchQuery`
5. Use `useKeyboardShortcuts()` hook to get shortcuts data
6. Use `useFilteredShortcuts()` hook to filter based on search
7. Group filtered shortcuts by category
8. Render Dialog with all child components:
   - DialogOverlay
   - DialogContent
   - DialogHeader with title and close button
   - SearchInput
   - ScrollableContent with ShortcutCategorySection for each category
   - EmptyState (conditionally)
9. Handle modal close (clear search query on close)
10. Export component

**Structure:**
```tsx
export function KeyboardHelpModal({ isOpen, onClose }: KeyboardHelpModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const allShortcuts = useKeyboardShortcuts();
  const filteredShortcuts = useFilteredShortcuts(searchQuery, allShortcuts);

  const globalShortcuts = filteredShortcuts.filter(s => s.category === 'global');
  const planShortcuts = filteredShortcuts.filter(s => s.category === 'plan');
  const workShortcuts = filteredShortcuts.filter(s => s.category === 'work');

  const handleClose = () => {
    setSearchQuery(''); // Reset search on close
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        <ScrollableContent>
          {filteredShortcuts.length === 0 ? (
            <EmptyState searchQuery={searchQuery} />
          ) : (
            <>
              <ShortcutCategorySection
                category="Global Shortcuts"
                shortcuts={globalShortcuts}
              />
              <ShortcutCategorySection
                category="Plan Mode Shortcuts"
                shortcuts={planShortcuts}
              />
              <ShortcutCategorySection
                category="Work Mode Shortcuts"
                shortcuts={workShortcuts}
              />
            </>
          )}
        </ScrollableContent>
      </DialogContent>
    </Dialog>
  );
}
```

**Deliverable:** Complete KeyboardHelpModal component

---

### Step 12: Integrate with AppShell

1. Open `/apps/frontend/src/components/AppShell.tsx` (or main layout component)
2. Add state for modal: `const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)`
3. Add global "?" key listener:
   ```tsx
   useEffect(() => {
     const handleKeyPress = (event: KeyboardEvent) => {
       const isInInput = ['INPUT', 'TEXTAREA'].includes(
         (event.target as HTMLElement).tagName
       );

       if (event.key === '?' && !isInInput && !event.isComposing) {
         event.preventDefault();
         setIsHelpModalOpen(prev => !prev);
       }
     };

     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, []);
   ```
4. Render `<KeyboardHelpModal>` component in layout:
   ```tsx
   <KeyboardHelpModal
     isOpen={isHelpModalOpen}
     onClose={() => setIsHelpModalOpen(false)}
   />
   ```
5. Optional: Add help icon button in AppHeader that opens modal

**Deliverable:** Functional keyboard help accessible from anywhere in app

---

### Step 13: Add Mobile Responsiveness

1. Update `KeyboardHelpModal` styles for mobile:
   - Full-screen on mobile: `className="sm:max-w-[800px] w-full h-full sm:h-auto"`
2. Update `KeyBadge` for larger touch targets on mobile
3. Adjust `ShortcutRow` layout for narrow viewports (stack vertically if needed)
4. Test on mobile devices and adjust spacing

**Deliverable:** Mobile-responsive modal

---

### Step 14: Add Accessibility Enhancements

1. Verify ARIA attributes on Dialog (should be automatic with shadcn/ui)
2. Add `aria-label` to search input
3. Add aria-live region for search results count:
   ```tsx
   <div className="sr-only" aria-live="polite" aria-atomic="true">
     {filteredShortcuts.length} shortcuts found
   </div>
   ```
4. Test with screen reader (VoiceOver, NVDA, or JAWS)
5. Verify keyboard navigation (Tab, Shift+Tab)
6. Test focus trap behavior

**Deliverable:** Fully accessible modal

---

### Step 15: Testing and Refinement

1. **Manual Testing:**
   - Open modal with "?" key from all views (Plan, Work, Done)
   - Test search functionality with various queries
   - Test all close methods (?, Esc, X, click outside)
   - Verify keyboard navigation
   - Test on mobile devices
   - Test with screen reader

2. **Cross-browser Testing:**
   - Chrome, Firefox, Safari, Edge
   - Verify platform detection (Cmd on Mac, Ctrl on Windows/Linux)

3. **Performance Testing:**
   - Verify search filtering is instant (no lag)
   - Check for memory leaks (open/close multiple times)

4. **Refinements:**
   - Adjust spacing and typography for readability
   - Refine search algorithm if needed (fuzzy matching)
   - Add animations/transitions for modal open/close
   - Polish visual design (shadows, borders, colors)

**Deliverable:** Fully tested and polished component

---

### Step 16: Documentation

1. Add JSDoc comments to all components and hooks
2. Update README with keyboard help feature
3. Add screenshots to documentation
4. Document keyboard shortcuts in user guide
5. Update CHANGELOG

**Deliverable:** Complete documentation

---

## Summary

This implementation plan provides a comprehensive blueprint for building the Keyboard Help Overlay. The component is designed to be:

1. **Accessible:** Full ARIA support, keyboard navigation, screen reader friendly
2. **User-friendly:** Real-time search, clear categorization, multiple close methods
3. **Performant:** Memoized filtering, efficient rendering
4. **Maintainable:** Modular components, clear separation of concerns
5. **Extensible:** Easy to add new shortcuts, customize styling

The implementation follows React best practices, uses shadcn/ui for consistent design, and aligns with the keyboard-first interaction model of the GSD application.
