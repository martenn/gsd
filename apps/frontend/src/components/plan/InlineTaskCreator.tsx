import { useState } from 'react';
import { Input } from '../ui/input';
import { useCreateTask } from '../../hooks/useTasks';

interface InlineTaskCreatorProps {
  listId: string;
  onCancel: () => void;
}

export function InlineTaskCreator({ listId, onCancel }: InlineTaskCreatorProps) {
  const [title, setTitle] = useState('');
  const createTaskMutation = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        title: title.trim(),
        listId,
      });
      setTitle('');
      onCancel();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-border p-3 bg-muted/30">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        maxLength={500}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- User explicitly triggered inline form, expects immediate focus
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => {
          if (!title.trim()) onCancel();
        }}
      />
      <div className="text-xs text-muted-foreground mt-1">Press Enter to create, Esc to cancel</div>
    </form>
  );
}
