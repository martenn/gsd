import { Card } from '../ui/card';
import { TaskColorIndicator } from '../done/TaskColorIndicator';
import type { TaskDto } from '@gsd/types';

interface CurrentTaskCardProps {
  task: TaskDto;
}

export function CurrentTaskCard({ task }: CurrentTaskCardProps) {
  return (
    <Card className="relative p-8 mb-8">
      <TaskColorIndicator color={task.color} />
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">{task.title}</h2>
          {task.description && (
            <p className="text-lg text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
