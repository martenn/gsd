import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { ListDto, TaskDto } from '@gsd/types';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskRow } from './TaskRow';
import { InlineTaskCreator } from './InlineTaskCreator';
import { ListHeader } from './ListHeader';
import { Card } from '../ui/card';
import { useListCollapsed } from '../../hooks/useListCollapsed';
import { useReorderTask } from '../../hooks/useTasks';

interface ListColumnProps {
  list: ListDto;
  lists: ListDto[];
  tasks: TaskDto[];
  totalNonDoneLists: number;
  backlogCount: number;
  fullWidth?: boolean;
}

const MAX_TASKS = 100;
const ORDER_STEP = 1000;

// Tasks render desc by orderIndex (top = highest). After arrayMove(tasks, old, new),
// the moved task sits at `newIndex` of `reordered`; its new orderIndex is computed
// from its new neighbors so a re-sort yields the same visual position.
function computeNewOrderIndex(reordered: TaskDto[], newIndex: number): number {
  const prev = reordered[newIndex - 1]; // above (higher orderIndex)
  const next = reordered[newIndex + 1]; // below (lower orderIndex)
  if (!prev) {
    return (next?.orderIndex ?? 0) + ORDER_STEP;
  }
  if (!next) {
    return prev.orderIndex / 2;
  }
  return (prev.orderIndex + next.orderIndex) / 2;
}

export function ListColumn({
  list,
  lists,
  tasks,
  totalNonDoneLists,
  backlogCount,
  fullWidth = false,
}: ListColumnProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCollapsed, toggleCollapsed] = useListCollapsed(list.id);
  const reorderTaskMutation = useReorderTask();

  // MouseSensor + KeyboardSensor only — TouchSensor intentionally omitted so DnD
  // stays desktop-only (mobile-swipe ownership is reserved for the Mobile sprint).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const canDelete = totalNonDoneLists > 1;
  const canToggleBacklog = list.isBacklog ? backlogCount > 1 : true;
  const canCreateTask = tasks.length < MAX_TASKS;
  const showTaskArea = !isCollapsed && (isCreatingTask || tasks.length > 0);

  const accentStyle: CSSProperties | undefined = list.color
    ? { borderLeft: `4px solid ${list.color}` }
    : undefined;

  const handleNewTask = () => {
    if (!canCreateTask) return;
    if (isCollapsed) toggleCollapsed();
    setIsCreatingTask(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    const newOrderIndex = computeNewOrderIndex(reordered, newIndex);
    reorderTaskMutation.mutate({
      taskId: String(active.id),
      data: { newOrderIndex },
    });
  };

  return (
    <Card
      className={`${fullWidth ? 'w-full' : 'flex-shrink-0 w-80'} flex flex-col overflow-hidden`}
      style={accentStyle}
    >
      <ListHeader
        list={list}
        lists={lists}
        taskCount={tasks.length}
        maxTasks={MAX_TASKS}
        canDelete={canDelete}
        canToggleBacklog={canToggleBacklog}
        onNewTask={handleNewTask}
        canCreateTask={canCreateTask}
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {showTaskArea && (
        <div
          className={fullWidth ? 'overflow-y-auto max-h-[60vh]' : 'flex-1 min-h-0 overflow-y-auto'}
        >
          {isCreatingTask && (
            <InlineTaskCreator listId={list.id} onCancel={() => setIsCreatingTask(false)} />
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} lists={lists} siblings={tasks} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </Card>
  );
}
