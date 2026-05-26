import { useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const continueAfterSubmitRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTaskData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const { ref: titleFieldRef, ...titleField } = register('title');
  const title = watch('title');

  const onSubmit = async (data: CreateTaskData) => {
    const shouldContinue = continueAfterSubmitRef.current;
    continueAfterSubmitRef.current = false;
    try {
      await createTaskMutation.mutateAsync({
        title: sanitizeText(data.title),
        listId,
      });
      if (shouldContinue) {
        reset({ title: '', description: '' });
        inputRef.current?.focus();
      } else {
        onCancel();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border-b border-border p-3 bg-muted/30">
      <Input
        {...titleField}
        ref={(el) => {
          titleFieldRef(el);
          inputRef.current = el;
        }}
        placeholder="Task title..."
        // eslint-disable-next-line jsx-a11y/no-autofocus -- User explicitly triggered inline form, expects immediate focus
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onCancel();
            return;
          }
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            continueAfterSubmitRef.current = true;
          }
        }}
        onBlur={() => {
          if (!title?.trim()) onCancel();
        }}
      />
      {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      <div className="text-xs text-muted-foreground mt-1">
        Enter to create, Cmd/Ctrl+Enter to create &amp; add another, Esc to cancel
      </div>
    </form>
  );
}
