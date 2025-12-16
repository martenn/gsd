import { useState } from 'react';
import type { TaskDto, ListDto } from '@gsd/types';
import { TaskActionsMenu } from './TaskActionsMenu';
import { TaskEditForm } from './TaskEditForm';
import { useUpdateTask } from '../../hooks/useTasks';

interface TaskRowProps {
  task: TaskDto;
  lists: ListDto[];
}

export function TaskRow({ task, lists }: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateTaskMutation = useUpdateTask();

  const handleSave = async (data: { title: string; description?: string }) => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        data,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (isEditing) {
    return <TaskEditForm task={task} onSave={handleSave} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="group relative border-b border-border last:border-0 py-2 px-3 hover:bg-muted/50 transition-colors">
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: task.color }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between pl-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{task.title}</div>
          {task.description && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </div>
          )}
        </div>

        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <TaskActionsMenu task={task} lists={lists} onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
}
