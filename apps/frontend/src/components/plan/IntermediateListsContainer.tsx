import type { ListDto, TaskDto } from '@gsd/types';
import { ListColumn } from './ListColumn';

interface IntermediateListsContainerProps {
  intermediateLists: ListDto[];
  tasksByListId: Record<string, TaskDto[]>;
}

export function IntermediateListsContainer({
  intermediateLists,
  tasksByListId,
}: IntermediateListsContainerProps) {
  return (
    <section className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="sticky top-0 bg-background pb-2 z-10">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Lists
        </h2>
      </div>
      <div className="flex gap-4 h-full pb-4">
        {intermediateLists.length === 0 ? (
          <div className="text-sm text-muted-foreground pt-2">
            No intermediate lists yet. Create one to organize your tasks.
          </div>
        ) : (
          intermediateLists.map((list) => (
            <ListColumn key={list.id} list={list} tasks={tasksByListId[list.id] || []} />
          ))
        )}
      </div>
    </section>
  );
}
