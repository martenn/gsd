import { Check } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { TaskColorIndicator } from '../done/TaskColorIndicator';
import type { TaskDto } from '@gsd/types';

interface WorkTaskTileProps {
  task: TaskDto;
  onComplete: (taskId: string) => void;
  disabled?: boolean;
}

export function WorkTaskTile({ task, onComplete, disabled }: WorkTaskTileProps) {
  return (
    <Card className="relative p-5">
      <TaskColorIndicator color={task.color} />
      <div className="flex items-center gap-4 pl-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-foreground">{task.title}</h2>
          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              {task.description}
            </p>
          )}
        </div>
        <Button
          onClick={() => onComplete(task.id)}
          disabled={disabled}
          className="shrink-0"
          aria-label={`Complete task: ${task.title}`}
        >
          <Check className="w-4 h-4 mr-2" />
          Complete
        </Button>
      </div>
    </Card>
  );
}
