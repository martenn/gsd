import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { ListDto, TaskDto } from '@gsd/types';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskRow } from './TaskRow';
import { InlineTaskCreator } from './InlineTaskCreator';
import { ListHeader } from './ListHeader';
import { Card } from '../ui/card';
import { useListCollapsed } from '../../hooks/useListCollapsed';

interface ListColumnProps {
  list: ListDto;
  lists: ListDto[];
  tasks: TaskDto[];
  totalNonDoneLists: number;
  backlogCount: number;
  fullWidth?: boolean;
}

const MAX_TASKS = 100;

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

  // Each list column is itself a droppable so empty lists still accept cross-list drops.
  // The DndContext lives in BoardLayout; here we just expose the droppable + sortable set.
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `list:${list.id}`,
    data: { type: 'list', listId: list.id },
  });

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

  return (
    <Card
      className={`${fullWidth ? 'w-full' : 'flex-shrink-0 w-80'} flex flex-col gap-0 py-0 overflow-hidden ${isOver ? 'ring-2 ring-primary/40' : ''}`}
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

      <div
        ref={setDroppableRef}
        className={
          showTaskArea
            ? fullWidth
              ? 'overflow-y-auto max-h-[60vh]'
              : 'flex-1 min-h-0 overflow-y-auto'
            : 'min-h-[40px]'
        }
      >
        {isCreatingTask && (
          <InlineTaskCreator listId={list.id} onCancel={() => setIsCreatingTask(false)} />
        )}
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} lists={lists} siblings={tasks} listId={list.id} />
          ))}
        </SortableContext>
      </div>
    </Card>
  );
}
