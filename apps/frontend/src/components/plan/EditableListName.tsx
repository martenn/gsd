import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateListSchema, type UpdateListData, sanitizeText } from '@gsd/validation';
import { Input } from '../ui/input';
import { useUpdateList } from '../../hooks/useLists';

interface EditableListNameProps {
  listId: string;
  name: string;
}

export function EditableListName({ listId, name }: EditableListNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateListMutation = useUpdateList();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateListData>({
    resolver: zodResolver(updateListSchema),
    defaultValues: {
      name,
    },
  });

  useEffect(() => {
    reset({ name });
  }, [name, reset]);

  const onSubmit = async (data: UpdateListData) => {
    const sanitizedName = sanitizeText(data.name);
    if (!sanitizedName || sanitizedName === name) {
      setIsEditing(false);
      reset({ name });
      return;
    }

    try {
      await updateListMutation.mutateAsync({
        listId,
        data: { name: sanitizedName },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update list name:', error);
      reset({ name });
    }
  };

  const handleCancel = () => {
    reset({ name });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1">
        <Input
          {...register('name')}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- User explicitly triggered edit, expects immediate focus
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
          }}
          onBlur={handleSubmit(onSubmit)}
          className="h-7 text-sm"
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors text-left"
    >
      {name}
    </button>
  );
}
