import type { ListDto, TaskDto } from '@gsd/types';
import { ListColumn } from './ListColumn';
import { CreateListButton } from './CreateListButton';

interface IntermediateListsContainerProps {
  intermediateLists: ListDto[];
  lists: ListDto[];
  tasksByListId: Record<string, TaskDto[]>;
  totalNonDoneLists: number;
  backlogCount: number;
}

export function IntermediateListsContainer({
  intermediateLists,
  lists,
  tasksByListId,
  totalNonDoneLists,
  backlogCount,
}: IntermediateListsContainerProps) {
  return (
    <section className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="sticky top-0 bg-background pb-2 z-10">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Lists
        </h2>
        <CreateListButton type="intermediate" />
      </div>
      <div className="flex gap-4 h-full pb-4 pt-2">
        {intermediateLists.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">
            No lists yet. Create one to organize your tasks.
          </div>
        ) : (
          intermediateLists.map((list) => (
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
    </section>
  );
}
