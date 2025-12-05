import type { ListDto, TaskDto } from '@gsd/types';
import { ListColumn } from './ListColumn';

interface BoardLayoutProps {
  lists: ListDto[];
  tasksByListId: Record<string, TaskDto[]>;
}

export function BoardLayout({ lists, tasksByListId }: BoardLayoutProps) {
  const backlogs = lists.filter((list) => list.isBacklog);
  const intermediateLists = lists.filter((list) => !list.isBacklog && !list.isDone);

  return (
    <div className="flex gap-4 h-full overflow-hidden p-6">
      <div className="flex-shrink-0 w-80 space-y-4 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Backlogs
        </h2>
        {backlogs.length === 0 ? (
          <div className="text-sm text-gray-500">No backlogs</div>
        ) : (
          backlogs.map((list) => (
            <ListColumn key={list.id} list={list} tasks={tasksByListId[list.id] || []} />
          ))
        )}
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 pb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 w-full">
            Lists
          </h2>
        </div>
        <div className="flex gap-4 pb-4">
          {intermediateLists.length === 0 ? (
            <div className="text-sm text-gray-500">No lists yet</div>
          ) : (
            intermediateLists.map((list) => (
              <ListColumn key={list.id} list={list} tasks={tasksByListId[list.id] || []} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
