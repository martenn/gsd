import { MoreVertical, Check, Trash2, Edit, ArrowRight } from 'lucide-react';
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
import { useCompleteTask, useDeleteTask, useMoveTask } from '../../hooks/useTasks';

interface TaskActionsMenuProps {
  task: TaskDto;
  lists: ListDto[];
  onEdit: () => void;
}

export function TaskActionsMenu({ task, lists, onEdit }: TaskActionsMenuProps) {
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();
  const moveTaskMutation = useMoveTask();

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
