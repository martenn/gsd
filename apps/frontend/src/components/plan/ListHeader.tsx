import { useRef } from 'react';
import type { ListDto } from '@gsd/types';
import { EditableListName } from './EditableListName';
import { ListLimitIndicator } from './ListLimitIndicator';
import { ListActionsMenu } from './ListActionsMenu';

interface ListHeaderProps {
  list: ListDto;
  lists: ListDto[];
  taskCount: number;
  maxTasks: number;
  canDelete: boolean;
  canToggleBacklog: boolean;
}

export function ListHeader({
  list,
  lists,
  taskCount,
  maxTasks,
  canDelete,
  canToggleBacklog,
}: ListHeaderProps) {
  const editableNameRef = useRef<HTMLDivElement>(null);

  const handleRename = () => {
    setTimeout(() => {
      const button = editableNameRef.current?.querySelector('button');
      button?.click();
    }, 0);
  };

  return (
    <div className="border-b border-border px-4 py-3 bg-muted/50">
      <div className="flex items-center justify-between gap-2">
        <div ref={editableNameRef} className="flex-1 min-w-0">
          <EditableListName listId={list.id} name={list.name} />
        </div>
        <div className="flex items-center gap-2">
          <ListLimitIndicator count={taskCount} max={maxTasks} />
          <ListActionsMenu
            list={list}
            lists={lists}
            canDelete={canDelete}
            canToggleBacklog={canToggleBacklog}
            onRename={handleRename}
          />
        </div>
      </div>
    </div>
  );
}
