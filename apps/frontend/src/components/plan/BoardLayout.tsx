import { useState, useEffect, useMemo } from 'react';
import type { ListDto, TaskDto } from '@gsd/types';
import { BacklogColumn } from './BacklogColumn';
import { IntermediateListsContainer } from './IntermediateListsContainer';
import { MobileListSelector } from './MobileListSelector';
import { ListColumn } from './ListColumn';

interface BoardLayoutProps {
  lists: ListDto[];
  tasksByListId: Record<string, TaskDto[]>;
}

export function BoardLayout({ lists, tasksByListId }: BoardLayoutProps) {
  const backlogs = lists.filter((list) => list.isBacklog);
  const intermediateLists = lists.filter((list) => !list.isBacklog && !list.isDone);

  const allDisplayLists = useMemo(
    () => [...backlogs, ...intermediateLists],
    [backlogs, intermediateLists],
  );

  const totalNonDoneLists = backlogs.length + intermediateLists.length;
  const backlogCount = backlogs.length;

  const [selectedMobileListId, setSelectedMobileListId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMobileListId && allDisplayLists.length > 0) {
      setSelectedMobileListId(allDisplayLists[0].id);
    }
  }, [selectedMobileListId, allDisplayLists]);

  const selectedMobileList = allDisplayLists.find((list) => list.id === selectedMobileListId);

  return (
    <div className="flex flex-col h-full bg-background">
      <MobileListSelector
        lists={lists}
        selectedListId={selectedMobileListId}
        onSelectList={setSelectedMobileListId}
      />

      <div className="hidden lg:flex gap-6 h-full overflow-hidden p-6">
        <BacklogColumn
          backlogs={backlogs}
          lists={lists}
          tasksByListId={tasksByListId}
          totalNonDoneLists={totalNonDoneLists}
          backlogCount={backlogCount}
        />
        <IntermediateListsContainer
          intermediateLists={intermediateLists}
          lists={lists}
          tasksByListId={tasksByListId}
          totalNonDoneLists={totalNonDoneLists}
          backlogCount={backlogCount}
        />
      </div>

      <div className="lg:hidden flex-1 overflow-hidden p-4">
        {selectedMobileList ? (
          <ListColumn
            list={selectedMobileList}
            lists={lists}
            tasks={tasksByListId[selectedMobileList.id] || []}
            totalNonDoneLists={totalNonDoneLists}
            backlogCount={backlogCount}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No lists available
          </div>
        )}
      </div>
    </div>
  );
}
