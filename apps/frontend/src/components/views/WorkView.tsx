import { useListsQuery } from '../../hooks/useLists';
import { useTasksQuery } from '../../hooks/useTasks';
import { useCompleteTask } from '../../hooks/useTasks';
import { CurrentTaskCard } from '../work/CurrentTaskCard';
import { ForecastSection } from '../work/ForecastSection';
import { CompleteButton } from '../work/CompleteButton';
import { EmptyWorkState } from '../work/EmptyWorkState';
import { Skeleton } from '../ui/skeleton';

export function WorkView() {
  const { data: lists, isLoading: listsLoading } = useListsQuery();
  const completeTaskMutation = useCompleteTask();

  const activeList = lists?.lists
    ?.filter((list) => list.name !== 'Done')
    .sort((a, b) => b.orderIndex - a.orderIndex)[0];

  const { data: tasksData, isLoading: tasksLoading } = useTasksQuery(
    activeList?.id ? { listId: activeList.id } : undefined,
  );

  const tasks = tasksData?.tasks || [];
  const currentTask = tasks[0];
  const forecastTasks = tasks.slice(1, 4);

  const handleComplete = () => {
    if (currentTask) {
      completeTaskMutation.mutate(currentTask.id);
    }
  };

  if (listsLoading || tasksLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <EmptyWorkState />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <CurrentTaskCard task={currentTask} />
      <div className="flex justify-center mb-8">
        <CompleteButton onClick={handleComplete} disabled={completeTaskMutation.isPending} />
      </div>
      <ForecastSection tasks={forecastTasks} />
    </div>
  );
}
