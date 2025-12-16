import { MoreVertical, Edit, Trash2, FolderInput } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useDeleteList, useToggleBacklog } from '../../hooks/useLists';
import type { ListDto } from '@gsd/types';

interface ListActionsMenuProps {
  list: ListDto;
  lists: ListDto[];
  canDelete: boolean;
  canToggleBacklog: boolean;
  onRename: () => void;
}

export function ListActionsMenu({
  list,
  lists,
  canDelete,
  canToggleBacklog,
  onRename,
}: ListActionsMenuProps) {
  const deleteListMutation = useDeleteList();
  const toggleBacklogMutation = useToggleBacklog();

  const handleToggleBacklog = async () => {
    try {
      await toggleBacklogMutation.mutateAsync(list.id);
    } catch (error) {
      console.error('Failed to toggle backlog status:', error);
    }
  };

  const handleDelete = async () => {
    const defaultDestination = lists.find((l) => l.id !== list.id && l.isBacklog && !l.isDone);

    if (!defaultDestination) {
      console.error('No valid destination list found');
      return;
    }

    const confirmMessage = `Delete "${list.name}"? Tasks will be moved to "${defaultDestination.name}".`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteListMutation.mutateAsync({
        listId: list.id,
        destinationListId: defaultDestination.id,
      });
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRename}>
          <Edit className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleToggleBacklog}
          disabled={!canToggleBacklog}
          title={
            !canToggleBacklog
              ? 'At least one backlog required'
              : list.isBacklog
                ? 'Unmark as backlog'
                : 'Mark as backlog'
          }
        >
          <FolderInput className="mr-2 h-4 w-4" />
          {list.isBacklog ? 'Unmark as Backlog' : 'Mark as Backlog'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={!canDelete}
          variant="destructive"
          title={!canDelete ? 'Cannot delete the only list' : 'Delete list'}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
