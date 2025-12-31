import type { DoneTaskDto } from '@gsd/types';
import { CompletedTaskCard } from './CompletedTaskCard';
import { EmptyDoneState } from './EmptyDoneState';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

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
      <div role="status" aria-label="Loading completed tasks">
        <LoadingSpinner variant="skeleton-card" count={5} />
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
