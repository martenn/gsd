import { useState } from 'react';
import { Input } from '../ui/input';
import { useUpdateList } from '../../hooks/useLists';

interface EditableListNameProps {
  listId: string;
  name: string;
}

export function EditableListName({ listId, name }: EditableListNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const updateListMutation = useUpdateList();

  const handleSave = async () => {
    if (!editedName.trim() || editedName === name) {
      setIsEditing(false);
      setEditedName(name);
      return;
    }

    try {
      await updateListMutation.mutateAsync({
        listId,
        data: { name: editedName.trim() },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update list name:', error);
      setEditedName(name);
    }
  };

  const handleCancel = () => {
    setEditedName(name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="flex-1"
      >
        <Input
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          maxLength={100}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- User explicitly triggered edit, expects immediate focus
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
          }}
          onBlur={handleSave}
          className="h-7 text-sm"
        />
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
