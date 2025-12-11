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
    <li className="group relative border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <TaskColorIndicator color={task.color} />

      <div className="pl-3">
        <h3 className="text-base font-semibold text-foreground mb-1">{task.title}</h3>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{task.description}</p>
        )}

        <div className="flex items-center gap-4">
          <CompletionTimestamp completedAt={completedDate} timezone={timezone} />

          <span className="text-muted-foreground/50" aria-hidden="true">
            •
          </span>

          <span className="text-xs text-muted-foreground">{task.listName}</span>
        </div>
      </div>
    </li>
  );
}
