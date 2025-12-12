import type { ListDto, TaskDto } from '@gsd/types';
import { ListColumn } from './ListColumn';
import { CreateListButton } from './CreateListButton';

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
      <div className="sticky top-0 bg-background pb-2 z-10 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
            <ListColumn key={list.id} list={list} tasks={tasksByListId[list.id] || []} />
          ))
        )}
      </div>
    </section>
  );
}
