import { MoreVertical, Check, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useCompleteTask, useDeleteTask } from '../../hooks/useTasks';

interface TaskActionsMenuProps {
  taskId: string;
}

export function TaskActionsMenu({ taskId }: TaskActionsMenuProps) {
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();

  const handleComplete = async () => {
    try {
      await completeTaskMutation.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
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
