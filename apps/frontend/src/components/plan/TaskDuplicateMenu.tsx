import { Copy } from 'lucide-react';
import type { ListDto, TaskDto } from '@gsd/types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useDuplicateTask } from '../../hooks/useTasks';

interface TaskDuplicateMenuProps {
  task: TaskDto;
  lists: ListDto[];
}

export function TaskDuplicateMenu({ task, lists }: TaskDuplicateMenuProps) {
  const duplicateTaskMutation = useDuplicateTask();

  // Board column order (mirrors BoardLayout): backlogs first, then intermediate
  // lists, Done excluded. The "left list" is the column immediately before the
  // task's current list; undefined when the task sits in the leftmost column.
  const displayOrder = [
    ...lists.filter((list) => list.isBacklog),
    ...lists.filter((list) => !list.isBacklog && !list.isDone),
  ];
  const currentIndex = displayOrder.findIndex((list) => list.id === task.listId);
  const leftList = currentIndex > 0 ? displayOrder[currentIndex - 1] : undefined;
  const originBacklog = lists.find((list) => list.id === task.originBacklogId);

  // targetListId undefined → duplicate in place (below the original). Otherwise
  // the copy lands at the top of the given list.
  const handleDuplicate = async (targetListId?: string) => {
    try {
      await duplicateTaskMutation.mutateAsync({ taskId: task.id, targetListId });
    } catch (error) {
      console.error('Failed to duplicate task:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label="Duplicate task">
          <Copy className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDuplicate(task.originBacklogId)}>
          In backlog{originBacklog ? ` (${originBacklog.name})` : ''}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!leftList}
          onClick={() => leftList && handleDuplicate(leftList.id)}
        >
          To the left list{leftList ? ` (${leftList.name})` : ''}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicate()}>Here</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
