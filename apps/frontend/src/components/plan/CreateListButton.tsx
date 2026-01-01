import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createListSchema, type CreateListData, sanitizeText } from '@gsd/validation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useCreateList } from '../../hooks/useLists';

interface CreateListButtonProps {
  type: 'backlog' | 'intermediate';
}

export function CreateListButton({ type }: CreateListButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const createListMutation = useCreateList();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateListData>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      name: '',
      isBacklog: type === 'backlog',
    },
  });

  const onSubmit = async (data: CreateListData) => {
    try {
      await createListMutation.mutateAsync({
        name: sanitizeText(data.name),
        isBacklog: type === 'backlog',
      });
      reset();
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleCancel = () => {
    reset();
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              {...register('name')}
              placeholder="List name..."
              // eslint-disable-next-line jsx-a11y/no-autofocus -- User explicitly triggered inline form, expects immediate focus
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancel();
              }}
            />
          </div>
          <Button type="submit" size="sm" disabled={createListMutation.isPending}>
            Add
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </form>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
      <Plus className="w-4 h-4 mr-2" />
      New {type === 'backlog' ? 'Backlog' : 'List'}
    </Button>
  );
}
