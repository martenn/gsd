import { useListsQuery } from '../../hooks/useLists';
import { useTasksQuery } from '../../hooks/useTasks';
import { BoardLayout } from '../plan/BoardLayout';
import { Skeleton } from '../ui/skeleton';

export function PlanView() {
  const { data: listsData, isLoading: listsLoading } = useListsQuery();
  const { data: tasksData, isLoading: tasksLoading } = useTasksQuery();

  const isLoading = listsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b border-border px-6 py-4 bg-background">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 p-6 flex gap-6">
          <div className="w-80 space-y-4">
            <Skeleton className="h-64" />
          </div>
          <div className="flex-1 flex gap-4">
            <Skeleton className="w-80 h-64" />
            <Skeleton className="w-80 h-64" />
          </div>
        </div>
      </div>
    );
  }

  const lists = listsData?.lists || [];
  const tasks = tasksData?.tasks || [];

  const tasksByListId = tasks.reduce(
    (acc, task) => {
      if (!acc[task.listId]) {
        acc[task.listId] = [];
      }
      acc[task.listId].push(task);
      return acc;
    },
    {} as Record<string, typeof tasks>,
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <BoardLayout lists={lists} tasksByListId={tasksByListId} />
      </div>
    </div>
  );
}
