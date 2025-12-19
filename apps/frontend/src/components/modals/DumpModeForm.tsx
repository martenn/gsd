import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useListsQuery } from '../../hooks/useLists';
import { useBulkAddTasks } from '../../hooks/useTasks';
import { BacklogSelector } from './BacklogSelector';
import { LineCounter } from './LineCounter';

const dumpModeFormSchema = z.object({
  taskLines: z
    .string()
    .min(1, 'Please enter at least one task')
    .refine(
      (value) => {
        const lines = value.split('\n').filter((line) => line.trim() !== '');
        return lines.length <= 10;
      },
      { message: 'Maximum 10 tasks allowed' },
    )
    .refine(
      (value) => {
        const lines = value.split('\n').filter((line) => line.trim() !== '');
        return lines.every((line) => line.length <= 500);
      },
      { message: 'Each task title must be 500 characters or less' },
    ),
  targetListId: z.string().min(1, 'Please select a backlog'),
});

type DumpModeFormData = z.infer<typeof dumpModeFormSchema>;

const LAST_USED_BACKLOG_KEY = 'dump-mode-last-backlog';

function getLastUsedBacklog(): string | null {
  return localStorage.getItem(LAST_USED_BACKLOG_KEY);
}

function setLastUsedBacklog(backlogId: string): void {
  localStorage.setItem(LAST_USED_BACKLOG_KEY, backlogId);
}

function getLineCount(text: string): number {
  return text.split('\n').filter((line) => line.trim() !== '').length;
}

interface DumpModeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function DumpModeForm({ onSuccess, onCancel }: DumpModeFormProps) {
  const { data: listsData } = useListsQuery();
  const lists = listsData?.lists || [];
  const backlogs = lists.filter((list) => list.isBacklog && !list.isDone);
  const { mutate, isPending, isError, error } = useBulkAddTasks();

  const lastUsedBacklog = getLastUsedBacklog();
  const defaultBacklogId =
    backlogs.find((b) => b.id === lastUsedBacklog)?.id || backlogs[0]?.id || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DumpModeFormData>({
    resolver: zodResolver(dumpModeFormSchema),
    defaultValues: {
      taskLines: '',
      targetListId: defaultBacklogId,
    },
  });

  const taskLines = watch('taskLines');
  const targetListId = watch('targetListId');
  const lineCount = getLineCount(taskLines);

  const selectedBacklog = backlogs.find((b) => b.id === targetListId);

  const onSubmit = (data: DumpModeFormData) => {
    const lines = data.taskLines
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');

    mutate(
      {
        tasks: lines.map((line) => ({ title: line })),
        listId: data.targetListId,
      },
      {
        onSuccess: () => {
          setLastUsedBacklog(data.targetListId);
          onSuccess();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  if (backlogs.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          No backlogs available. Create a backlog first to use Dump Mode.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Form needs to handle keyboard shortcuts
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="taskLines">Task Titles</Label>
          <LineCounter currentCount={lineCount} maxCount={10} />
        </div>
        <Textarea
          id="taskLines"
          {...register('taskLines')}
          placeholder="Enter task titles (one per line, max 10)"
          className="min-h-[150px] resize-none"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- Modal input should autofocus when opened for better UX
          autoFocus
          disabled={isPending}
        />
        {errors.taskLines && <p className="text-xs text-destructive">{errors.taskLines.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetListId">Add to Backlog</Label>
        <BacklogSelector
          backlogs={backlogs}
          selectedBacklogId={targetListId}
          onSelect={(backlogId) => {
            const event = { target: { name: 'targetListId', value: backlogId } };
            register('targetListId').onChange(event as any);
          }}
        />
        {errors.targetListId && (
          <p className="text-xs text-destructive">{errors.targetListId.message}</p>
        )}
      </div>

      {isError && (
        <p className="text-xs text-destructive">
          {error instanceof Error ? error.message : 'Failed to add tasks. Please try again.'}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Cmd+Enter to submit • Esc to cancel</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={lineCount === 0 || lineCount > 10 || isPending}>
            {isPending ? 'Adding...' : `Add to ${selectedBacklog?.name || 'Backlog'}`}
          </Button>
        </div>
      </div>
    </form>
  );
}
