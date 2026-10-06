import { useListsQuery } from '../../hooks/useLists';
import { useTasksQuery } from '../../hooks/useTasks';
import { useCompleteTask } from '../../hooks/useTasks';
import { WorkTaskTile } from '../work/WorkTaskTile';
import { ForecastSection } from '../work/ForecastSection';
import { EmptyWorkState } from '../work/EmptyWorkState';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const WORK_WINDOW_SIZE = 3;
const UP_NEXT_SIZE = 3;

export function WorkView() {
  const { data: lists, isLoading: listsLoading } = useListsQuery();
  const completeTaskMutation = useCompleteTask();

  const nonDoneLists = lists?.lists?.filter((list) => !list.isDone) ?? [];
  const intermediateLists = nonDoneLists.filter((list) => !list.isBacklog);
  const activeList =
    intermediateLists.length > 0
      ? [...intermediateLists].sort((a, b) => b.orderIndex - a.orderIndex)[0]
      : [...nonDoneLists].sort((a, b) => a.orderIndex - b.orderIndex)[0];

  const { data: tasksData, isLoading: tasksLoading } = useTasksQuery(
    activeList?.id ? { listId: activeList.id } : undefined,
  );

  const tasks = tasksData?.tasks || [];
  const windowTasks = tasks.slice(0, WORK_WINDOW_SIZE);
  const upNextTasks = tasks.slice(WORK_WINDOW_SIZE, WORK_WINDOW_SIZE + UP_NEXT_SIZE);

  if (listsLoading || tasksLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <LoadingSpinner variant="skeleton-card" count={1} />
      </div>
    );
  }

  if (windowTasks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <EmptyWorkState />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="space-y-3 mb-8">
        {windowTasks.map((task) => (
          <WorkTaskTile
            key={task.id}
            task={task}
            onComplete={(taskId) => completeTaskMutation.mutate(taskId)}
            disabled={completeTaskMutation.isPending}
          />
        ))}
      </div>
      <ForecastSection tasks={upNextTasks} />
    </div>
  );
}
