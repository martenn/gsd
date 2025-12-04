import type { DoneTaskDto } from '@gsd/types';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

interface CompletedTaskCardProps {
  task: DoneTaskDto;
}

export function CompletedTaskCard({ task }: CompletedTaskCardProps) {
  const completedDate = new Date(task.completedAt);
  const now = new Date();
  const diffDays = differenceInDays(now, completedDate);
  const useRelative = diffDays < 7;

  const relativeTime = formatDistanceToNow(completedDate, { addSuffix: true });
  const absoluteTime = format(completedDate, 'MMM d, yyyy h:mm a');
  const displayTime = useRelative ? relativeTime : absoluteTime;

  return (
    <li className="group relative border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: task.color }}
        aria-hidden="true"
      />

      <div className="pl-3">
        <h3 className="text-base font-semibold text-gray-900 mb-1">{task.title}</h3>

        {task.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-3">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <time dateTime={completedDate.toISOString()} title={absoluteTime}>
            Completed {displayTime}
          </time>

          <span className="text-gray-400">•</span>

          <span>{task.listName}</span>
        </div>
      </div>
    </li>
  );
}
