import { useRef } from 'react';
import type { ListDto } from '@gsd/types';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { EditableListName } from './EditableListName';
import { ListLimitIndicator } from './ListLimitIndicator';
import { ListActionsMenu } from './ListActionsMenu';
import { Button } from '../ui/button';

interface ListHeaderProps {
  list: ListDto;
  lists: ListDto[];
  taskCount: number;
  maxTasks: number;
  canDelete: boolean;
  canToggleBacklog: boolean;
  onNewTask: () => void;
  canCreateTask: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function ListHeader({
  list,
  lists,
  taskCount,
  maxTasks,
  canDelete,
  canToggleBacklog,
  onNewTask,
  canCreateTask,
  isCollapsed,
  onToggleCollapsed,
}: ListHeaderProps) {
  const editableNameRef = useRef<HTMLDivElement>(null);

  const handleRename = () => {
    setTimeout(() => {
      const button = editableNameRef.current?.querySelector('button');
      button?.click();
    }, 0);
  };

  return (
    <div className="border-b border-border px-2 py-0.5 bg-muted/50">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expand list' : 'Collapse list'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <div ref={editableNameRef} className="flex-1 min-w-0">
          <EditableListName listId={list.id} name={list.name} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ListLimitIndicator count={taskCount} max={maxTasks} />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onNewTask}
            disabled={!canCreateTask}
            aria-label="New task"
            title={canCreateTask ? 'New task' : 'List is full (max 100 tasks)'}
          >
            <Plus className="h-4 w-4" />
          </Button>
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
