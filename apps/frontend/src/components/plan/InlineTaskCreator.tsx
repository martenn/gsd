import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, type CreateTaskData, sanitizeText } from '@gsd/validation';
import { Input } from '../ui/input';
import { useCreateTask } from '../../hooks/useTasks';

interface InlineTaskCreatorProps {
  listId: string;
  onCancel: () => void;
}

export function InlineTaskCreator({ listId, onCancel }: InlineTaskCreatorProps) {
  const createTaskMutation = useCreateTask();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateTaskData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const title = watch('title');

  const onSubmit = async (data: CreateTaskData) => {
    try {
      await createTaskMutation.mutateAsync({
        title: sanitizeText(data.title),
        listId,
      });
      onCancel();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border-b border-border p-3 bg-muted/30">
      <Input
        {...register('title')}
        placeholder="Task title..."
        // eslint-disable-next-line jsx-a11y/no-autofocus -- User explicitly triggered inline form, expects immediate focus
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => {
          if (!title?.trim()) onCancel();
        }}
      />
      {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      <div className="text-xs text-muted-foreground mt-1">Press Enter to create, Esc to cancel</div>
    </form>
  );
}
