import { useListsQuery } from '../../hooks/useLists';
import { useTasksQuery } from '../../hooks/useTasks';
import { BoardLayout } from '../plan/BoardLayout';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function PlanView() {
  const { data: listsData, isLoading: listsLoading } = useListsQuery();
  const { data: tasksData, isLoading: tasksLoading } = useTasksQuery();

  const isLoading = listsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner variant="spinner" />
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
