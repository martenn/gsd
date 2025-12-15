import type { ListDto, TaskDto } from '@gsd/types';
import { ListColumn } from './ListColumn';
import { CreateListButton } from './CreateListButton';

interface BacklogColumnProps {
  backlogs: ListDto[];
  lists: ListDto[];
  tasksByListId: Record<string, TaskDto[]>;
  totalNonDoneLists: number;
  backlogCount: number;
}

export function BacklogColumn({
  backlogs,
  lists,
  tasksByListId,
  totalNonDoneLists,
  backlogCount,
}: BacklogColumnProps) {
  return (
    <aside className="flex-shrink-0 w-80 space-y-4 overflow-y-auto border-r border-border pr-4">
      <div className="sticky top-0 bg-background pb-2 z-10">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Backlogs
        </h2>
        <CreateListButton type="backlog" />
      </div>
      <div className="space-y-4">
        {backlogs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">
            No backlogs yet. Create one to get started.
          </div>
        ) : (
          backlogs.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              lists={lists}
              tasks={tasksByListId[list.id] || []}
              totalNonDoneLists={totalNonDoneLists}
              backlogCount={backlogCount}
            />
          ))
        )}
      </div>
    </aside>
  );
}
