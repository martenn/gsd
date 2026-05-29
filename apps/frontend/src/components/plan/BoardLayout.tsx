import { useState, useEffect, useMemo } from 'react';
import type { ListDto, TaskDto } from '@gsd/types';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { BacklogColumn } from './BacklogColumn';
import { IntermediateListsContainer } from './IntermediateListsContainer';
import { MobileListSelector } from './MobileListSelector';
import { ListColumn } from './ListColumn';
import { useMoveTask, useReorderTask } from '../../hooks/useTasks';

interface BoardLayoutProps {
  lists: ListDto[];
  tasksByListId: Record<string, TaskDto[]>;
}

const ORDER_STEP = 1000;

// Tasks render desc by orderIndex. After arrayMove, the moved task sits at
// `newIndex` of `reordered`; the new orderIndex is midpoint with its new
// neighbors so a server-side re-sort yields the same visual position.
function computeNewOrderIndex(reordered: TaskDto[], newIndex: number): number {
  const prev = reordered[newIndex - 1]; // above (higher orderIndex)
  const next = reordered[newIndex + 1]; // below (lower orderIndex)
  if (!prev) return (next?.orderIndex ?? 0) + ORDER_STEP;
  if (!next) return prev.orderIndex / 2;
  return (prev.orderIndex + next.orderIndex) / 2;
}

// Cross-list drop: place the moved task immediately above the target task in
// the destination list.
function computeOrderIndexAbove(targetTasks: TaskDto[], targetIndex: number): number {
  const target = targetTasks[targetIndex];
  const above = targetTasks[targetIndex - 1];
  if (!target) return ORDER_STEP;
  if (!above) return target.orderIndex + ORDER_STEP;
  return (above.orderIndex + target.orderIndex) / 2;
}

type ActiveData = { type: 'task'; listId: string };
type OverData = { type: 'task'; listId: string } | { type: 'list'; listId: string };

export function BoardLayout({ lists, tasksByListId }: BoardLayoutProps) {
  const backlogs = lists.filter((list) => list.isBacklog);
  const intermediateLists = lists.filter((list) => !list.isBacklog && !list.isDone);

  const allDisplayLists = useMemo(
    () => [...backlogs, ...intermediateLists],
    [backlogs, intermediateLists],
  );

  const totalNonDoneLists = backlogs.length + intermediateLists.length;
  const backlogCount = backlogs.length;

  const [selectedMobileListId, setSelectedMobileListId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMobileListId && allDisplayLists.length > 0) {
      setSelectedMobileListId(allDisplayLists[0].id);
    }
  }, [selectedMobileListId, allDisplayLists]);

  const selectedMobileList = allDisplayLists.find((list) => list.id === selectedMobileListId);

  const moveTaskMutation = useMoveTask();
  const reorderTaskMutation = useReorderTask();

  // MouseSensor + KeyboardSensor only — no TouchSensor so DnD stays desktop-only.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as ActiveData | undefined;
    const overData = over.data.current as OverData | undefined;
    if (activeData?.type !== 'task' || !overData) return;

    const taskId = String(active.id);
    const sourceListId = activeData.listId;
    const targetListId = overData.listId;

    if (sourceListId === targetListId && overData.type === 'task') {
      const sourceTasks = tasksByListId[sourceListId] ?? [];
      const oldIndex = sourceTasks.findIndex((t) => t.id === taskId);
      const newIndex = sourceTasks.findIndex((t) => t.id === String(over.id));
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const reordered = arrayMove(sourceTasks, oldIndex, newIndex);
      const newOrderIndex = computeNewOrderIndex(reordered, newIndex);
      reorderTaskMutation.mutate({ taskId, data: { newOrderIndex } });
      return;
    }

    // Cross-list move. Compute the destination orderIndex either above the
    // task we dropped on, or "top" if dropped on the column itself / empty list.
    const targetTasks = tasksByListId[targetListId] ?? [];
    let newOrderIndex: number | undefined;
    if (overData.type === 'task') {
      const targetIndex = targetTasks.findIndex((t) => t.id === String(over.id));
      if (targetIndex >= 0) {
        newOrderIndex = computeOrderIndexAbove(targetTasks, targetIndex);
      }
    }
    moveTaskMutation.mutate({
      taskId,
      data: { listId: targetListId, newOrderIndex },
    });
  };

  const board = (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="hidden lg:flex gap-6 h-full overflow-hidden p-6">
        <BacklogColumn
          backlogs={backlogs}
          lists={lists}
          tasksByListId={tasksByListId}
          totalNonDoneLists={totalNonDoneLists}
          backlogCount={backlogCount}
        />
        <IntermediateListsContainer
          intermediateLists={intermediateLists}
          lists={lists}
          tasksByListId={tasksByListId}
          totalNonDoneLists={totalNonDoneLists}
          backlogCount={backlogCount}
        />
      </div>
    </DndContext>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <MobileListSelector
        lists={lists}
        selectedListId={selectedMobileListId}
        onSelectList={setSelectedMobileListId}
      />

      {board}

      <div className="lg:hidden flex-1 overflow-hidden p-4">
        {selectedMobileList ? (
          <ListColumn
            list={selectedMobileList}
            lists={lists}
            tasks={tasksByListId[selectedMobileList.id] || []}
            totalNonDoneLists={totalNonDoneLists}
            backlogCount={backlogCount}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No lists available
          </div>
        )}
      </div>
    </div>
  );
}
