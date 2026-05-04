# Mobile Responsiveness Implementation Plan

**Goal:** Implement comprehensive mobile responsiveness for GSD app per PRD requirements (US-021, US-021A)

**Estimated Effort:** 8-10 days (64-80 hours)

---

## Executive Summary

Current state: App has basic mobile support (MobileListSelector dropdown, lg: breakpoint split) but lacks swipe navigation, proper touch targets, and mobile-optimized layouts.

**Key Requirements (PRD Section 3.10):**
- Plan mode: One list at a time with swipe navigation
- Work mode: Full-screen focus with Complete action
- Touch targets: Minimum 44x44px (WCAG AA)
- Visual differentiation: Backlogs clearly distinguished
- Responsive: Desktop (≥1024px) and Mobile (<1024px)

**Strategy:** Enhance existing responsive foundation with swipe gestures, touch optimization, and view-specific mobile layouts.

---

## Phase 1: Foundation & Header (Days 1-2)

### 1.1 Install Dependencies
```bash
pnpm add react-swipeable --filter @gsd/frontend
```

**Library Choice:** react-swipeable (4KB, hook-based, TypeScript support)

### 1.2 Header Mobile Optimization

**File:** `apps/frontend/src/components/app-shell/AppHeader.tsx`
- Make sticky on mobile: `lg:relative sticky top-0 z-40`
- Reduce padding: `px-3 py-3 md:px-6 md:py-4`

**File:** `apps/frontend/src/components/app-shell/Logo.tsx`
- Add CheckSquare icon from lucide-react
- Hide text on small screens: `<span className="hidden sm:block">GSD</span>`

**File:** `apps/frontend/src/components/app-shell/ModeNavigation.tsx`
- Compact spacing: `gap-1 md:gap-2`
- Smaller buttons on mobile: `px-2 py-1.5 md:px-4 md:py-2`, `text-xs md:text-sm`

**File:** `apps/frontend/src/components/app-shell/UserMenu.tsx`
- Larger avatar on mobile: `w-10 h-10 md:w-8 md:h-8`
- Hide email text: `<span className="hidden md:inline">{user.email}</span>`

**Deliverables:**
- Responsive header working on all screen sizes
- Sticky header on mobile for quick mode switching
- Touch-friendly navigation buttons

---

## Phase 2: Plan Mode Swipe Navigation (Days 3-5)

### 2.1 Create Mobile Components Directory
```
apps/frontend/src/components/mobile/
├── SwipeableListContainer.tsx
├── ListPositionDots.tsx
└── FABButton.tsx
```

### 2.2 Swipeable List Container (NEW)

**File:** `apps/frontend/src/components/mobile/SwipeableListContainer.tsx`

**Purpose:** Wrap mobile list view with swipe gesture detection

**Implementation:**
```typescript
import { useSwipeable } from 'react-swipeable';

interface Props {
  currentListIndex: number;
  totalLists: number;
  onNavigate: (direction: 'next' | 'prev') => void;
  children: React.ReactNode;
}

export function SwipeableListContainer({ currentListIndex, totalLists, onNavigate, children }: Props) {
  const handlers = useSwipeable({
    onSwipedLeft: () => currentListIndex < totalLists - 1 && onNavigate('next'),
    onSwipedRight: () => currentListIndex > 0 && onNavigate('prev'),
    preventScrollOnSwipe: true,
    trackMouse: false, // Touch only
    delta: 50, // Min swipe distance
  });

  return (
    <div {...handlers} className="h-full touch-pan-y">
      {children}
    </div>
  );
}
```

**Key Features:**
- Swipe left: Next list
- Swipe right: Previous list
- Boundary checking (no swipe beyond first/last)
- Vertical scroll preserved (`touch-pan-y`)

### 2.3 Position Indicators (NEW)

**File:** `apps/frontend/src/components/mobile/ListPositionDots.tsx`

**Purpose:** Show current position in list sequence

**Implementation:**
```typescript
interface Props {
  currentIndex: number;
  totalLists: number;
  onDotClick: (index: number) => void;
}

export function ListPositionDots({ currentIndex, totalLists, onDotClick }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: Math.min(totalLists, 10) }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={cn(
            "rounded-full transition-all",
            index === currentIndex
              ? "w-2.5 h-2.5 bg-primary"
              : "w-2 h-2 bg-muted hover:bg-muted-foreground/50"
          )}
          aria-label={`Go to list ${index + 1}`}
        />
      ))}
    </div>
  );
}
```

### 2.4 Integrate Swipe in BoardLayout

**File:** `apps/frontend/src/components/plan/BoardLayout.tsx`

**Changes:**
1. Add list navigation logic:
```typescript
const currentListIndex = allDisplayLists.findIndex(l => l.id === selectedMobileListId);

const handleNavigate = (direction: 'next' | 'prev') => {
  const newIndex = direction === 'next' ? currentListIndex + 1 : currentListIndex - 1;
  if (newIndex >= 0 && newIndex < allDisplayLists.length) {
    setSelectedMobileListId(allDisplayLists[newIndex].id);
  }
};
```

2. Wrap mobile list view:
```typescript
<div className="lg:hidden flex-1 overflow-hidden">
  <SwipeableListContainer
    currentListIndex={currentListIndex}
    totalLists={allDisplayLists.length}
    onNavigate={handleNavigate}
  >
    <div className="h-full p-4">
      {selectedMobileList && (
        <ListColumn
          list={selectedMobileList}
          lists={lists}
          tasks={tasksByListId[selectedMobileList.id] || []}
          totalNonDoneLists={totalNonDoneLists}
          backlogCount={backlogCount}
        />
      )}
    </div>
  </SwipeableListContainer>

  <ListPositionDots
    currentIndex={currentListIndex}
    totalLists={allDisplayLists.length}
    onDotClick={(index) => setSelectedMobileListId(allDisplayLists[index].id)}
  />
</div>
```

### 2.5 Touch Target Optimization

**File:** `apps/frontend/src/components/plan/TaskRow.tsx`
- Increase padding: `py-2` → `py-3 sm:py-2`
- Add min-height: `min-h-[44px]`

**File:** `apps/frontend/src/components/plan/InlineTaskCreator.tsx`
- Larger inputs: `h-12` on mobile
- Larger buttons: Ensure 44px minimum height

**File:** `apps/frontend/src/components/plan/TaskActionsMenu.tsx`
- Larger trigger button: `h-11 w-11 md:h-8 md:w-8`

**File:** `apps/frontend/src/components/plan/MobileListSelector.tsx`
- Increase height: `h-12` → `h-14`
- Show task count: `{list.name} ({taskCount})`

**Deliverables:**
- Swipe left/right to navigate lists
- Position dots show current list
- All touch targets meet 44x44px minimum
- Smooth transitions between lists

---

## Phase 3: Work & Done Mode Mobile (Days 6-7)

### 3.1 Work Mode Full-Screen Layout

**File:** `apps/frontend/src/components/views/WorkView.tsx`

**Changes:**
```typescript
// Before: max-w-3xl mx-auto px-4 py-8
// After: Full-screen on mobile, centered on desktop
className="lg:max-w-3xl lg:mx-auto px-3 py-4 lg:px-4 lg:py-8 min-h-[calc(100vh-64px)]"
```

**File:** `apps/frontend/src/components/work/CurrentTaskCard.tsx`
- Reduce padding: `p-4 md:p-6 lg:p-8`
- Scale typography: `text-2xl md:text-3xl` (title), `text-base md:text-lg` (description)
- Reduce spacing: `mb-4 md:mb-6 lg:mb-8`

**File:** `apps/frontend/src/components/work/CompleteButton.tsx`
- Sticky on mobile (optional): `lg:relative fixed bottom-4 left-4 right-4 lg:w-auto`
- Adjust sizing: `py-4 md:py-6`, `text-base md:text-lg`

### 3.2 Collapsible Forecast Section

**File:** `apps/frontend/src/components/mobile/CollapsibleSection.tsx` (NEW)

**Purpose:** Reusable accordion for mobile

```typescript
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, count, defaultOpen = false, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <Collapsible.Trigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
        <span>
          {title} {count !== undefined && `(${count})`}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Collapsible.Trigger>
      <Collapsible.Content>{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
```

**File:** `apps/frontend/src/components/work/ForecastSection.tsx`

**Changes:**
```typescript
// Desktop: Always expanded
// Mobile: Collapsible
return (
  <div className="hidden lg:block">
    {/* Desktop: Current implementation */}
  </div>
  <div className="lg:hidden">
    <CollapsibleSection title="Up Next" count={forecastTasks.length} defaultOpen={false}>
      {/* Mobile: Collapsible forecast */}
    </CollapsibleSection>
  </div>
);
```

### 3.3 Done View Mobile Optimization

**File:** `apps/frontend/src/components/done/MetricsHeader.tsx`
- Stack on mobile: `flex-col sm:flex-row sm:flex-wrap`
- Full-width badges: Child badges get `w-full sm:w-auto`

**File:** `apps/frontend/src/components/done/PaginationControls.tsx`
- Reduce visible pages on mobile: Show max 3 page numbers (vs 7 on desktop)
- Larger buttons: `size="default"` on mobile vs `size="sm"` on desktop

**File:** `apps/frontend/src/components/done/CompletedTaskCard.tsx`
- Increase padding for better touch spacing
- Ensure min-height 56px per card

**Deliverables:**
- Work mode optimized for mobile focus
- Forecast collapsible to save space
- Done view pagination works on small screens
- Metrics display properly stacked on mobile

---

## Phase 4: Polish & Testing (Days 8-10)

### 4.1 FAB for Task Creation (Optional)

**File:** `apps/frontend/src/components/mobile/FABButton.tsx` (NEW)

**Purpose:** Floating Action Button for quick task creation on mobile

```typescript
interface Props {
  onClick: () => void;
  label: string;
}

export function FABButton({ onClick, label }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow sm:hidden"
      aria-label={label}
    >
      <Plus className="h-6 w-6 mx-auto" />
    </button>
  );
}
```

**Integration:** Add to Plan mode for mobile task creation (only visible on small screens)

### 4.2 Testing Checklist

**Breakpoint Testing:**
- [ ] 375px (iPhone SE) - All views usable
- [ ] 390px (iPhone 12+) - Comfortable layout
- [ ] 768px (iPad Portrait) - Tablet optimization
- [ ] 1024px (Desktop cutoff) - Desktop layout kicks in
- [ ] 1280px+ (Large desktop) - No issues

**Touch Interaction Testing:**
- [ ] Swipe left/right navigates lists smoothly
- [ ] Swipe at boundaries shows bounce/resistance
- [ ] Vertical scroll doesn't interfere with swipe
- [ ] Position dots clickable and update correctly
- [ ] All buttons meet 44x44px minimum

**View-Specific Testing:**
- [ ] Plan: MobileListSelector, swipe, position dots, touch targets
- [ ] Work: Full-screen layout, sticky button, collapsible forecast
- [ ] Done: Stacked metrics, responsive pagination, readable cards

**Cross-Browser Testing:**
- [ ] Safari iOS (webkit)
- [ ] Chrome Android
- [ ] Firefox mobile (optional)

**Performance Testing:**
- [ ] Lighthouse mobile score ≥90
- [ ] Swipe animation maintains 60fps
- [ ] Time to Interactive <3s on 3G

**Accessibility Testing:**
- [ ] VoiceOver (iOS) - All controls announced
- [ ] TalkBack (Android) - Navigation works
- [ ] Touch targets meet WCAG AAA (44x44px)
- [ ] Color contrast meets WCAG AA (4.5:1)

### 4.3 Documentation Updates

**File:** `CLAUDE.md`
- Add mobile responsiveness guidelines
- Document breakpoint conventions (lg: at 1024px)
- Document swipe gesture patterns

**File:** `.ai/plans/views/mobile-responsiveness-view-implementation-plan.md`
- This plan serves as reference documentation

---

## Critical Files Reference

**Highest Priority (Phase 2):**
- `apps/frontend/src/components/plan/BoardLayout.tsx` - Core swipe integration
- `apps/frontend/src/components/mobile/SwipeableListContainer.tsx` - NEW - Swipe gestures
- `apps/frontend/src/components/mobile/ListPositionDots.tsx` - NEW - Position indicators

**High Priority (Phase 1):**
- `apps/frontend/src/components/app-shell/AppHeader.tsx` - Sticky, responsive layout
- `apps/frontend/src/components/app-shell/Logo.tsx` - Icon variant
- `apps/frontend/src/components/app-shell/UserMenu.tsx` - Hide email, larger avatar
- `apps/frontend/src/components/app-shell/ModeNavigation.tsx` - Compact buttons

**Medium Priority (Phase 3):**
- `apps/frontend/src/components/views/WorkView.tsx` - Full-screen layout
- `apps/frontend/src/components/work/ForecastSection.tsx` - Collapsible
- `apps/frontend/src/components/mobile/CollapsibleSection.tsx` - NEW - Accordion
- `apps/frontend/src/components/done/MetricsHeader.tsx` - Stacked layout
- `apps/frontend/src/components/done/PaginationControls.tsx` - Fewer pages on mobile

**Touch Target Optimization (Phase 2):**
- `apps/frontend/src/components/plan/TaskRow.tsx` - Larger padding, min-height
- `apps/frontend/src/components/plan/InlineTaskCreator.tsx` - Larger inputs/buttons
- `apps/frontend/src/components/plan/TaskActionsMenu.tsx` - Larger trigger button
- `apps/frontend/src/components/plan/MobileListSelector.tsx` - Taller, show count

---

## Verification Steps

### Manual Testing
1. Open app on mobile device or Chrome DevTools device mode
2. Navigate to Plan mode
3. **Test swipe navigation:**
   - Swipe left → Next list loads
   - Swipe right → Previous list loads
   - Swipe at first list → Bounces, doesn't navigate
   - Swipe at last list → Bounces, doesn't navigate
4. **Test position dots:**
   - Dots show correct active list
   - Tap dot → Jumps to that list
5. **Test touch targets:**
   - All buttons easy to tap (44x44px minimum)
   - TaskRow tappable without accidental actions
6. **Test Work mode:**
   - Layout fills screen without wasted space
   - Complete button is large and easily reachable
   - Forecast section can be collapsed/expanded
7. **Test Done view:**
   - Metrics stack vertically on small screens
   - Pagination controls work without overlapping
8. **Test header:**
   - Mode navigation fits without wrapping
   - Logo displays appropriately (icon on mobile)
   - User menu avatar is tappable

### Automated Testing (Optional)
```bash
# Lighthouse mobile audit
npm run lighthouse:mobile

# Playwright E2E tests (add mobile viewport)
npm run test:e2e -- --project=mobile

# Visual regression testing (Percy, Chromatic)
npm run test:visual -- --mobile
```

### Device Testing Matrix
- iPhone SE (375px) - Small phone
- iPhone 12+ (390px) - Standard phone
- iPad Mini (768px) - Small tablet
- Android phone (various) - Via BrowserStack

---

## Success Criteria

✅ **Functional Requirements:**
- Plan mode shows one list at a time on mobile (<1024px)
- Swipe left/right navigates between lists
- Position indicators show current list
- All touch targets minimum 44x44px
- Work mode full-screen on mobile
- Done view pagination works on small screens

✅ **User Experience:**
- Swipe gestures feel natural (<100ms response)
- No horizontal scrolling (except intentional swipe)
- Text readable without zooming (16px minimum)
- Forms usable with mobile keyboards

✅ **Performance:**
- Lighthouse mobile score ≥90
- Time to Interactive <3s on 3G
- Swipe animation 60fps

✅ **Accessibility:**
- Keyboard accessible (for external keyboards)
- Screen reader compatible (VoiceOver, TalkBack)
- Touch targets meet WCAG AAA (44x44px)

✅ **PRD Compliance:**
- US-021: Mobile navigation (swipe + dropdown) ✓
- US-021A: Backlog differentiation clear ✓
- Section 3.10: Mobile UX requirements satisfied ✓

---

## Estimated Effort Summary

| Phase | Days | Focus |
|-------|------|-------|
| Phase 1: Foundation | 2 | Header, setup, dependencies |
| Phase 2: Plan Mode | 3 | Swipe gestures, touch targets |
| Phase 3: Work/Done | 2 | Full-screen optimization |
| Phase 4: Polish/Test | 3 | Testing, docs, fixes |
| **Total** | **10** | |

**Risk Buffer:** +2 days for unexpected issues (swipe conflicts, cross-browser bugs)

---

## Next Steps After Approval

1. Install react-swipeable library
2. Create mobile components directory
3. Begin Phase 1 (Header optimization)
4. Test on real devices early and often
5. Get user feedback on swipe gesture feel
