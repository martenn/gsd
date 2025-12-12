import type { ListDto, TaskDto } from '@gsd/types';
import { ListColumn } from './ListColumn';

interface BacklogColumnProps {
  backlogs: ListDto[];
  tasksByListId: Record<string, TaskDto[]>;
}

export function BacklogColumn({ backlogs, tasksByListId }: BacklogColumnProps) {
  return (
    <aside className="flex-shrink-0 w-80 space-y-4 overflow-y-auto border-r border-border pr-4">
      <div className="sticky top-0 bg-background pb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Backlogs
        </h2>
      </div>
      <div className="space-y-4">
        {backlogs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No backlogs</div>
        ) : (
          backlogs.map((list) => (
            <ListColumn key={list.id} list={list} tasks={tasksByListId[list.id] || []} />
          ))
        )}
      </div>
    </aside>
  );
}
