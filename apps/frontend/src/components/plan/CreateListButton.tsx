import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useCreateList } from '../../hooks/useLists';

interface CreateListButtonProps {
  type: 'backlog' | 'intermediate';
}

export function CreateListButton({ type }: CreateListButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const createListMutation = useCreateList();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createListMutation.mutateAsync({
        name: name.trim(),
        isBacklog: type === 'backlog',
      });
      setName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleCancel = () => {
    setName('');
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name..."
          maxLength={100}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- User explicitly triggered inline form, expects immediate focus
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <Button type="submit" size="sm" disabled={!name.trim()}>
          Add
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <Button variant="outline" size="sm" className="w-full" onClick={() => setIsCreating(true)}>
      <Plus className="w-4 h-4 mr-2" />
      New {type === 'backlog' ? 'Backlog' : 'List'}
    </Button>
  );
}
