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
  // Bounded flex column: the header keeps its natural height and the columns row
  // takes exactly the rest. Without min-h-0 the row grows past the viewport and
  // its overflow gets clipped and unreachable.
  return (
    <section className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="shrink-0 bg-background pb-2">
        <CreateListButton type="intermediate" title="Lists" />
      </div>
      <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4 pt-2">
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
