import type { TaskDto, ListDto } from '@gsd/types';

export interface WorkModeViewModel {
  activeList: ListDto | null;
  currentTask: TaskDto | null;
  forecastTasks: TaskDto[];
  hasContent: boolean;
}

export interface ActiveListInfo {
  list: ListDto | null;
  isLoading: boolean;
}
