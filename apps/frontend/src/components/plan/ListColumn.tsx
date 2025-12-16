import { useState } from 'react';
import type { ListDto, TaskDto } from '@gsd/types';
import { Plus } from 'lucide-react';
import { TaskRow } from './TaskRow';
import { InlineTaskCreator } from './InlineTaskCreator';
import { ListHeader } from './ListHeader';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface ListColumnProps {
  list: ListDto;
  lists: ListDto[];
  tasks: TaskDto[];
  totalNonDoneLists: number;
  backlogCount: number;
}

export function ListColumn({
  list,
  lists,
  tasks,
  totalNonDoneLists,
  backlogCount,
}: ListColumnProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const canDelete = totalNonDoneLists > 1;
  const canToggleBacklog = list.isBacklog ? backlogCount > 1 : true;
  const maxTasks = 100;

  return (
    <Card className="flex-shrink-0 w-80 flex flex-col">
      <ListHeader
        list={list}
        lists={lists}
        taskCount={tasks.length}
        maxTasks={maxTasks}
        canDelete={canDelete}
        canToggleBacklog={canToggleBacklog}
      />
      <div className="border-b border-border px-3 py-2 bg-background">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 justify-start text-xs"
          onClick={() => setIsCreatingTask(true)}
          disabled={tasks.length >= maxTasks}
        >
          <Plus className="h-3 w-3 mr-1" />
          New Task
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        {isCreatingTask && (
          <InlineTaskCreator listId={list.id} onCancel={() => setIsCreatingTask(false)} />
        )}
        {tasks.length === 0 && !isCreatingTask ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No tasks yet</div>
        ) : (
          tasks.map((task) => <TaskRow key={task.id} task={task} lists={lists} />)
        )}
      </div>
    </Card>
  );
}
