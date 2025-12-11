import type { DoneTaskDto } from '@gsd/types';
import { CompletedTaskCard } from './CompletedTaskCard';
import { EmptyDoneState } from './EmptyDoneState';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

interface CompletedTaskListProps {
  tasks: DoneTaskDto[];
  timezone: string;
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function CompletedTaskList({
  tasks,
  timezone,
  isLoading,
  error,
  onRetry,
}: CompletedTaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading completed tasks">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" role="alert" aria-live="polite">
        <p className="text-destructive mb-4">{error.message}</p>
        {onRetry && <Button onClick={onRetry}>Retry</Button>}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyDoneState />;
  }

  return (
    <ul className="space-y-3" aria-label={`Completed tasks list, ${tasks.length} items`}>
      {tasks.map((task) => (
        <CompletedTaskCard key={task.id} task={task} timezone={timezone} />
      ))}
    </ul>
  );
}
