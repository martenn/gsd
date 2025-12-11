import { Card } from '../ui/card';
import { TaskColorIndicator } from '../done/TaskColorIndicator';
import type { TaskDto } from '@gsd/types';

interface ForecastTaskCardProps {
  task: TaskDto;
}

export function ForecastTaskCard({ task }: ForecastTaskCardProps) {
  return (
    <Card className="relative p-4">
      <TaskColorIndicator color={task.color} />
      <div>
        <h3 className="font-medium text-foreground mb-1">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        )}
      </div>
    </Card>
  );
}
