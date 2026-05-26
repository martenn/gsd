import { MoreVertical, Check, Trash2, Edit, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import type { ListDto, TaskDto } from '@gsd/types';
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
import { useCompleteTask, useDeleteTask, useMoveTask, useReorderTask } from '../../hooks/useTasks';

interface TaskActionsMenuProps {
  task: TaskDto;
  lists: ListDto[];
  siblings: TaskDto[];
  onEdit: () => void;
}

// Tasks render in descending orderIndex (top = highest). Move Up = increase
// orderIndex above the neighbor above; Move Down = decrease below the neighbor below.
function newOrderIndexForMoveUp(siblings: TaskDto[], position: number): number {
  const above = siblings[position - 1];
  const aboveAbove = siblings[position - 2];
  if (!aboveAbove) {
    return above.orderIndex + 1;
  }
  return (above.orderIndex + aboveAbove.orderIndex) / 2;
}

function newOrderIndexForMoveDown(siblings: TaskDto[], position: number): number {
  const below = siblings[position + 1];
  const belowBelow = siblings[position + 2];
  if (!belowBelow) {
    return below.orderIndex / 2;
  }
  return (below.orderIndex + belowBelow.orderIndex) / 2;
}

export function TaskActionsMenu({ task, lists, siblings, onEdit }: TaskActionsMenuProps) {
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();
  const moveTaskMutation = useMoveTask();
  const reorderTaskMutation = useReorderTask();

  const position = siblings.findIndex((t) => t.id === task.id);
  const canMoveUp = position > 0;
  const canMoveDown = position >= 0 && position < siblings.length - 1;

  const availableDestinations = lists.filter((list) => list.id !== task.listId && !list.isDone);

  const handleComplete = async () => {
    try {
      await completeTaskMutation.mutateAsync(task.id);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task.id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleMove = async (destinationListId: string) => {
    try {
      await moveTaskMutation.mutateAsync({
        taskId: task.id,
        data: { listId: destinationListId },
      });
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleMoveUp = async () => {
    if (!canMoveUp) return;
    try {
      await reorderTaskMutation.mutateAsync({
        taskId: task.id,
        data: { newOrderIndex: newOrderIndexForMoveUp(siblings, position) },
      });
    } catch (error) {
      console.error('Failed to move task up:', error);
    }
  };

  const handleMoveDown = async () => {
    if (!canMoveDown) return;
    try {
      await reorderTaskMutation.mutateAsync({
        taskId: task.id,
        data: { newOrderIndex: newOrderIndexForMoveDown(siblings, position) },
      });
    } catch (error) {
      console.error('Failed to move task down:', error);
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
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleMoveUp} disabled={!canMoveUp}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMoveDown} disabled={!canMoveDown}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={availableDestinations.length === 0}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Move to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {availableDestinations.map((list) => (
              <DropdownMenuItem key={list.id} onClick={() => handleMove(list.id)}>
                {list.name}
              </DropdownMenuItem>
            ))}
            {availableDestinations.length === 0 && (
              <DropdownMenuItem disabled>No other lists available</DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleComplete}>
          <Check className="mr-2 h-4 w-4" />
          Complete
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
