import type { TaskDto } from '@gsd/types';

interface TaskRowProps {
  task: TaskDto;
}

export function TaskRow({ task }: TaskRowProps) {
  return (
    <div className="group relative border-b border-gray-200 py-2 px-3 hover:bg-gray-50 transition-colors">
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: task.color }}
        aria-hidden="true"
      />

      <div className="pl-2">
        <div className="text-sm font-medium text-gray-900">{task.title}</div>
        {task.description && (
          <div className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</div>
        )}
      </div>
    </div>
  );
}
