import { useListsQuery } from '../../hooks/useLists';
import { useTasksQuery } from '../../hooks/useTasks';
import { BoardLayout } from '../plan/BoardLayout';

export function PlanView() {
  const { data: listsData, isLoading: listsLoading } = useListsQuery();
  const { data: tasksData, isLoading: tasksLoading } = useTasksQuery();

  const isLoading = listsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading your workspace...</div>
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
    <div className="h-screen flex flex-col">
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Plan Mode</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <BoardLayout lists={lists} tasksByListId={tasksByListId} />
      </div>
    </div>
  );
}
