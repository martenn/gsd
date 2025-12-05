import type { DoneTaskDto } from '@gsd/types';
import { CompletedTaskCard } from './CompletedTaskCard';
import { EmptyDoneState } from './EmptyDoneState';

interface CompletedTaskListProps {
  tasks: DoneTaskDto[];
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function CompletedTaskList({ tasks, isLoading, error, onRetry }: CompletedTaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading completed tasks">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyDoneState />;
  }

  return (
    <ul className="space-y-3" aria-label={`Completed tasks list, ${tasks.length} items`}>
      {tasks.map((task) => (
        <CompletedTaskCard key={task.id} task={task} />
      ))}
    </ul>
  );
}
