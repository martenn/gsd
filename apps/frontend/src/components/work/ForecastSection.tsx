import { ForecastTaskCard } from './ForecastTaskCard';
import type { TaskDto } from '@gsd/types';

interface ForecastSectionProps {
  tasks: TaskDto[];
}

export function ForecastSection({ tasks }: ForecastSectionProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-muted-foreground">Up Next</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <ForecastTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
