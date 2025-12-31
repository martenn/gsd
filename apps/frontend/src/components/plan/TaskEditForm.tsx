import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTaskSchema, type UpdateTaskData, sanitizeText } from '@gsd/validation';
import type { TaskDto } from '@gsd/types';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

interface TaskEditFormProps {
  task: TaskDto;
  onSave: (data: { title: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}

export function TaskEditForm({ task, onSave, onCancel }: TaskEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTaskData>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
    },
  });

  const onSubmit = async (data: UpdateTaskData) => {
    try {
      await onSave({
        title: sanitizeText(data.title),
        description: data.description ? sanitizeText(data.description) : undefined,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border-b border-border p-3 bg-muted/30">
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: task.color }}
        aria-hidden="true"
      />

      <div className="pl-2 space-y-2">
        <div>
          <Input
            {...register('title')}
            placeholder="Task title..."
            className="text-sm font-medium"
            onKeyDown={handleInputKeyDown}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- User explicitly triggered edit, expects immediate focus
            autoFocus
            disabled={isSubmitting}
          />
          {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Textarea
            {...register('description')}
            placeholder="Description (optional)..."
            className="text-xs min-h-[60px] resize-none"
            onKeyDown={handleInputKeyDown}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            Enter to save • Esc to cancel
          </span>
        </div>
      </div>
    </form>
  );
}
