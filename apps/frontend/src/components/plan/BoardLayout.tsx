import type { ListDto, TaskDto } from '@gsd/types';
import { BacklogColumn } from './BacklogColumn';
import { IntermediateListsContainer } from './IntermediateListsContainer';

interface BoardLayoutProps {
  lists: ListDto[];
  tasksByListId: Record<string, TaskDto[]>;
}

export function BoardLayout({ lists, tasksByListId }: BoardLayoutProps) {
  const backlogs = lists.filter((list) => list.isBacklog);
  const intermediateLists = lists.filter((list) => !list.isBacklog && !list.isDone);

  return (
    <div className="flex gap-6 h-full overflow-hidden p-6 bg-background">
      <BacklogColumn backlogs={backlogs} tasksByListId={tasksByListId} />
      <IntermediateListsContainer
        intermediateLists={intermediateLists}
        tasksByListId={tasksByListId}
      />
    </div>
  );
}
