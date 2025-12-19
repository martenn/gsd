import type { ListDto } from '@gsd/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface MobileListSelectorProps {
  lists: ListDto[];
  selectedListId: string | null;
  onSelectList: (listId: string) => void;
}

export function MobileListSelector({
  lists,
  selectedListId,
  onSelectList,
}: MobileListSelectorProps) {
  const backlogs = lists.filter((list) => list.isBacklog);
  const intermediateLists = lists.filter((list) => !list.isBacklog && !list.isDone);
  const allDisplayLists = [...backlogs, ...intermediateLists];

  const selectedList = allDisplayLists.find((list) => list.id === selectedListId);

  return (
    <div className="lg:hidden w-full px-4 py-3 bg-background border-b border-border">
      <Select value={selectedListId || undefined} onValueChange={onSelectList}>
        <SelectTrigger className="w-full h-12 text-base">
          <SelectValue>
            {selectedList ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedList.name}</span>
                {selectedList.isBacklog && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    Backlog
                  </span>
                )}
              </div>
            ) : (
              'Select a list'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {backlogs.length > 0 && (
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Backlogs</div>
          )}
          {backlogs.map((list) => (
            <SelectItem key={list.id} value={list.id} className="h-12">
              {list.name}
            </SelectItem>
          ))}
          {intermediateLists.length > 0 && (
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Lists
            </div>
          )}
          {intermediateLists.map((list) => (
            <SelectItem key={list.id} value={list.id} className="h-12">
              {list.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
