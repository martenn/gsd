import {
  MoreVertical,
  Edit,
  Trash2,
  FolderInput,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  PackageOpen,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  useDeleteList,
  useMoveAllTasks,
  useReorderList,
  useToggleBacklog,
} from '../../hooks/useLists';
import type { ListDto } from '@gsd/types';

interface ListActionsMenuProps {
  list: ListDto;
  lists: ListDto[];
  canDelete: boolean;
  canToggleBacklog: boolean;
  onRename: () => void;
}

// Lists render ascending by orderIndex (left/top first). Earlier sibling = lower orderIndex.
function newOrderIndexForMoveEarlier(siblings: ListDto[], position: number): number {
  const earlier = siblings[position - 1];
  const earlierEarlier = siblings[position - 2];
  if (!earlierEarlier) {
    return earlier.orderIndex / 2;
  }
  return (earlierEarlier.orderIndex + earlier.orderIndex) / 2;
}

function newOrderIndexForMoveLater(siblings: ListDto[], position: number): number {
  const later = siblings[position + 1];
  const laterLater = siblings[position + 2];
  if (!laterLater) {
    return later.orderIndex + 1;
  }
  return (later.orderIndex + laterLater.orderIndex) / 2;
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
  const reorderListMutation = useReorderList();
  const moveAllTasksMutation = useMoveAllTasks();

  const moveAllDestinations = lists.filter((l) => l.id !== list.id && !l.isDone);

  const siblings = lists
    .filter((l) => !l.isDone && l.isBacklog === list.isBacklog)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const position = siblings.findIndex((l) => l.id === list.id);
  const canMoveEarlier = position > 0;
  const canMoveLater = position >= 0 && position < siblings.length - 1;

  const moveEarlierLabel = list.isBacklog ? 'Move up' : 'Move left';
  const moveLaterLabel = list.isBacklog ? 'Move down' : 'Move right';
  const MoveEarlierIcon = list.isBacklog ? ArrowUp : ArrowLeft;
  const MoveLaterIcon = list.isBacklog ? ArrowDown : ArrowRight;

  const handleToggleBacklog = async () => {
    try {
      await toggleBacklogMutation.mutateAsync(list.id);
    } catch (error) {
      console.error('Failed to toggle backlog status:', error);
    }
  };

  const handleMoveEarlier = async () => {
    if (!canMoveEarlier) return;
    try {
      await reorderListMutation.mutateAsync({
        listId: list.id,
        data: { newOrderIndex: newOrderIndexForMoveEarlier(siblings, position) },
      });
    } catch (error) {
      console.error(`Failed to ${moveEarlierLabel.toLowerCase()}:`, error);
    }
  };

  const handleMoveLater = async () => {
    if (!canMoveLater) return;
    try {
      await reorderListMutation.mutateAsync({
        listId: list.id,
        data: { newOrderIndex: newOrderIndexForMoveLater(siblings, position) },
      });
    } catch (error) {
      console.error(`Failed to ${moveLaterLabel.toLowerCase()}:`, error);
    }
  };

  const handleMoveAllTasks = async (destinationListId: string) => {
    try {
      await moveAllTasksMutation.mutateAsync({
        sourceListId: list.id,
        data: { destinationListId },
      });
    } catch (error) {
      console.error('Failed to move all tasks:', error);
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
        <DropdownMenuItem onClick={handleMoveEarlier} disabled={!canMoveEarlier}>
          <MoveEarlierIcon className="mr-2 h-4 w-4" />
          {moveEarlierLabel}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMoveLater} disabled={!canMoveLater}>
          <MoveLaterIcon className="mr-2 h-4 w-4" />
          {moveLaterLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={moveAllDestinations.length === 0}>
            <PackageOpen className="mr-2 h-4 w-4" />
            Move all tasks to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {moveAllDestinations.map((destination) => (
              <DropdownMenuItem
                key={destination.id}
                onClick={() => handleMoveAllTasks(destination.id)}
              >
                {destination.name}
              </DropdownMenuItem>
            ))}
            {moveAllDestinations.length === 0 && (
              <DropdownMenuItem disabled>No other lists available</DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
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
