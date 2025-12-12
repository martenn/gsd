import type { ListDto, TaskDto } from '@gsd/types';
import { TaskRow } from './TaskRow';
import { Card } from '../ui/card';

interface ListColumnProps {
  list: ListDto;
  tasks: TaskDto[];
}

export function ListColumn({ list, tasks }: ListColumnProps) {
  return (
    <Card className="flex-shrink-0 w-80 flex flex-col">
      <div className="border-b border-border px-4 py-3 bg-muted/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{list.name}</h3>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No tasks yet</div>
        ) : (
          tasks.map((task) => <TaskRow key={task.id} task={task} />)
        )}
      </div>
    </Card>
  );
}
