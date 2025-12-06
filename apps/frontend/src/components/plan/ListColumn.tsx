import type { ListDto, TaskDto } from '@gsd/types';
import { TaskRow } from './TaskRow';

interface ListColumnProps {
  list: ListDto;
  tasks: TaskDto[];
}

export function ListColumn({ list, tasks }: ListColumnProps) {
  return (
    <div className="flex-shrink-0 w-80 border border-gray-300 rounded-lg bg-white">
      <div className="border-b border-gray-300 px-4 py-3 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{list.name}</h3>
          <span className="text-xs text-gray-500">{tasks.length} tasks</span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No tasks yet</div>
        ) : (
          tasks.map((task) => <TaskRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
