import type { DoneTaskDto } from '@gsd/types';
import { TaskColorIndicator } from './TaskColorIndicator';
import { CompletionTimestamp } from './CompletionTimestamp';

interface CompletedTaskCardProps {
  task: DoneTaskDto;
  timezone: string;
}

export function CompletedTaskCard({ task, timezone }: CompletedTaskCardProps) {
  const completedDate = new Date(task.completedAt);

  return (
    <li
      className="relative flex items-center gap-3 border border-border rounded-md py-2 pl-4 pr-3 hover:bg-muted/50 transition-colors"
      title={task.description || undefined}
    >
      <TaskColorIndicator color={task.color} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {task.title}
      </span>
      <span className="hidden sm:inline shrink-0 text-xs text-muted-foreground">
        {task.listName}
      </span>
      <CompletionTimestamp completedAt={completedDate} timezone={timezone} />
    </li>
  );
}
