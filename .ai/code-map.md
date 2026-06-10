# GSD Code Map

Navigation aid for the **task** and **list** features (Plan board, task actions, DnD, keyboard groundwork) and their backend/shared counterparts. Paths are relative to the repo root. Keep in sync when files move.

> Convention reminders: tasks render **DESC** by `orderIndex` (top = highest); lists render **ASC**. Order steps are 1000 (`OrderIndexHelper`). A task always has `originBacklogId` set.

---

## Frontend — Plan board (`apps/frontend/src/components/plan/`)

- `BoardLayout.tsx` — owns the single `DndContext` (Mouse + Keyboard sensors, `closestCorners`); `handleDragEnd` branches same-list reorder vs cross-list move; builds `tasksByListId`. Wrap point for any future keyboard-nav provider.
- `IntermediateListsContainer.tsx` — lays out the intermediate (non-backlog, non-done) columns.
- `BacklogColumn.tsx` — backlog-specific column wrapper (leftmost group).
- `ListColumn.tsx` — `useDroppable({id: list:<id>})` + `SortableContext`; renders `TaskRow`s; collapse via `useListCollapsed`; `fullWidth` prop; Card padding overridden `gap-0 py-0`.
- `ListHeader.tsx` — column header (title, count, actions trigger).
- `EditableListName.tsx` — inline list-name editing.
- `ListActionsMenu.tsx` — list-level menu: rename, reorder, toggle backlog, **Move all tasks** (submenu), delete-with-destination.
- `ListLimitIndicator.tsx` — shows when the 10-list / 100-task limits are hit (controls disabled, not hidden).
- `TaskRow.tsx` — `useSortable` task item; hover toolbar (lg+ grip handle, **Duplicate to backlog** `CopyPlus` → leftmost, **Duplicate here** `Copy`, **Complete** `CheckCircle`) + `TaskActionsMenu`; inline edit via `TaskEditForm`. 6px color bar from `task.color`.
- `TaskActionsMenu.tsx` — `⋯` dropdown: Edit · Move to top/up/down/bottom · Move to (submenu) · Complete · Delete. (Duplicate now lives as row buttons in `TaskRow`.)
- `TaskEditForm.tsx` — inline title/description edit form.
- `InlineTaskCreator.tsx` — top-of-list new-task input (Cmd+Enter sticky multi-add).
- `CreateListButton.tsx` — `+` to create a new list/backlog.
- `MobileListSelector.tsx` — mobile column switcher (mobile sprint groundwork).

## Frontend — other modes

- Work: `components/work/` — `CurrentTaskCard.tsx`, `CompleteButton.tsx`, `ForecastSection.tsx` + `ForecastTaskCard.tsx`, `EmptyWorkState.tsx`.
- Done: `components/done/` — `CompletedTaskList.tsx` / `CompletedTaskCard.tsx`, `MetricsHeader.tsx` + `MetricBadge.tsx`, `PaginationControls.tsx`, `EmptyDoneState.tsx`.
- Dump: `components/modals/` — `DumpModeModal.tsx` + `DumpModeForm.tsx`, `BacklogSelector.tsx`, `LineCounter.tsx`.

## Frontend — hooks (`apps/frontend/src/hooks/`)

- `useTasks.ts` — `useTasksQuery`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useMoveTask` (optimistic), `useReorderTask` (optimistic), `useDuplicateTask` (`{ taskId, target }`), `useCompleteTask`, `useBulkAddTasks`. Query key `['tasks']`.
- `useLists.ts` — `useListsQuery`, `useCreateList`, `useUpdateList`, `useDeleteList`, `useToggleBacklog`, `useReorderList`, `useMoveAllTasks`. Query key `['lists']`.
- `useListCollapsed.ts` — per-session collapsed-list state.
- `useGlobalKeyboardShortcut.ts` — modifier-aware global key listener (foundation for keyboard mode).
- Supporting: `useAuth.ts`, `useDone.ts`, `useMetrics.ts`, `usePagination.ts`, `useRelativeTime.ts`, `useTimezoneDetection.ts`.

## Frontend — API client (`apps/frontend/src/lib/api/`)

- `client.ts` — `apiClient.{get,post,patch,delete}`, `post<T>(path, data?)`; credentials + `ApiError`.
- `tasks.ts` — `getTasks`, `createTask`, `updateTask`, `deleteTask`, `moveTask`, `reorderTask`, `duplicateTask(taskId, target?)`, `completeTask`, `bulkAddTasks`.
- `lists.ts` — `getLists`, `createList`, `updateList`, `deleteList(listId, destinationListId)`, `toggleBacklog`, `reorderList`, `moveAllTasks`.

---

## Backend — tasks module (`apps/backend/src/tasks/`)

**Controller** `adapters/tasks.controller.ts` (`/v1/tasks`, JwtAuthGuard):

| Route | Use-case |
|---|---|
| `GET /` | `GetTasks` |
| `POST /` | `CreateTask` |
| `PATCH /:id` | `UpdateTask` |
| `DELETE /:id` | `DeleteTask` |
| `POST /:id/move` | `MoveTask` (listId + optional `newOrderIndex`) |
| `POST /:id/complete` | `CompleteTask` |
| `POST /:id/reorder` | `ReorderTask` (`newOrderIndex` \| `afterTaskId`) |
| `POST /:id/duplicate` | `DuplicateTask` (body `{ target?: 'in-place' \| 'origin-backlog' }`) |
| `POST /bulk-add` | `BulkAddTasks` |

**Use-cases** `use-cases/` — one `execute()` each:
- `create-task.ts` — inserts at top via `OrderIndexHelper.calculateTopPosition`; assigns `originBacklogId` + color.
- `get-tasks.ts` — by user/list, pagination, `includeCompleted`.
- `update-task.ts`, `delete-task.ts`.
- `move-task.ts` — cross-list move (+ same-list reorder when explicit `newOrderIndex`); capacity + Done-list guards; injects `ListsRepository`.
- `complete-task.ts` — sets `completedAt`, moves to Done.
- `reorder-task.ts` — same-list orderIndex change.
- `duplicate-task.ts` — copies title/description/originBacklog; `in-place` = midpoint below original, `origin-backlog` = top of origin backlog; injects `ListsRepository`.
- `bulk-add-tasks.ts` — multi-line add to a list.

**Infra / DTO / mappers:**
- `infra/tasks.repository.ts` — Prisma ops: `create`, `findById`, `findManyByList/User`, `update`, `delete`, `countByList/User`, `findMaxOrderIndex`, `findMinOrderIndex`, `findNextBelow`, `reindexListTasks`, `moveTask`, `moveAllNonCompletedTasks`, `completeTask`, `updateOrderIndex`, `reassignOriginBacklog`.
- `infra/order-index.helper.ts` — `calculateTopPosition`, `calculateInsertAtTop`, `generateReindexedOrder`, `needsReindexing` (step 1000).
- `dto/` — `create-task`, `update-task`, `move-task`, `reorder-task`, `get-tasks-query`, `bulk-add-tasks`, `duplicate-task`.
- `mappers/task.mapper.ts` — entity → `TaskDto` (resolves color from origin backlog).
- `tasks.module.ts` — imports `ListsModule` (forwardRef); providers/exports all use-cases + repo + mapper.

## Backend — lists module (`apps/backend/src/lists/`)

**Controller** `adapters/lists.controller.ts` (`/v1/lists`, JwtAuthGuard):

| Route | Use-case |
|---|---|
| `GET /` | `GetLists` |
| `POST /` | `CreateList` |
| `PATCH /:id` | `UpdateList` |
| `POST /:id/toggle-backlog` | `ToggleBacklog` |
| `POST /:id/reorder` | `ReorderList` |
| `POST /:id/move-tasks` | `MoveAllTasks` |
| `DELETE /:id` | `DeleteList` (destination via body/query) |

**Use-cases** `use-cases/`: `create-list.ts`, `get-lists.ts`, `update-list.ts`, `delete-list.ts` (promote/relocate tasks, keep ≥1 backlog), `toggle-backlog.ts`, `reorder-list.ts`, `move-all-tasks.ts`.
**Infra/DTO:** `infra/lists.repository.ts`; `dto/` — `create-list`, `update-list`, `reorder-list`, `move-all-tasks`.

---

## Shared packages

- `packages/types/src/api/tasks.ts` — `TaskDto`, request/response DTOs, `DuplicateTaskTarget` / `DuplicateTaskRequest`.
- `packages/types/src/api/lists.ts` — `ListDto`, list request/response DTOs.
- `packages/validation/src/` — zod schemas (task title ≤500, description ≤5000, list name ≤100, bulk-add ≤10 lines).
