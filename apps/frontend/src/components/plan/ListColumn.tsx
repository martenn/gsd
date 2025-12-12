import { useState } from 'react';
import type { ListDto, TaskDto } from '@gsd/types';
import { Plus } from 'lucide-react';
import { TaskRow } from './TaskRow';
import { InlineTaskCreator } from './InlineTaskCreator';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface ListColumnProps {
  list: ListDto;
  tasks: TaskDto[];
}

export function ListColumn({ list, tasks }: ListColumnProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  return (
    <Card className="flex-shrink-0 w-80 flex flex-col">
      <div className="border-b border-border px-4 py-3 bg-muted/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{list.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{tasks.length}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsCreatingTask(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        {isCreatingTask && (
          <InlineTaskCreator listId={list.id} onCancel={() => setIsCreatingTask(false)} />
        )}
        {tasks.length === 0 && !isCreatingTask ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No tasks yet</div>
        ) : (
          tasks.map((task) => <TaskRow key={task.id} task={task} />)
        )}
      </div>
    </Card>
  );
}
