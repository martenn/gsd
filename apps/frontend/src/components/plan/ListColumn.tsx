import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { ListDto, TaskDto } from '@gsd/types';
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
        <div className="flex-1 overflow-y-auto max-h-[600px]">
          {isCreatingTask && (
            <InlineTaskCreator listId={list.id} onCancel={() => setIsCreatingTask(false)} />
          )}
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} lists={lists} siblings={tasks} />
          ))}
        </div>
      )}
    </Card>
  );
}
