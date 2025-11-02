export interface TaskDto {
  id: string;
  userId: string;
  listId: string;
  originBacklogId: string;

  title: string;
  description: string | null;

  orderIndex: number;
  color: string;
  isCompleted: boolean;

  createdAt: Date;
  completedAt: Date | null;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  listId: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
}

export interface MoveTaskRequest {
  listId: string;
}

export interface ReorderTaskRequest {
  newOrderIndex?: number;
  afterTaskId?: string;
}

export interface BulkAddTasksRequest {
  tasks: Array<{
    title: string;
    description?: string;
  }>;
  listId?: string;
}

export interface GetTasksQuery {
  listId?: string;
  includeCompleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateTaskResponseDto {
  task: TaskDto;
  message?: string;
}

export interface UpdateTaskResponseDto {
  task: TaskDto;
  message?: string;
}

export interface GetTasksResponseDto {
  tasks: TaskDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface MoveTaskResponseDto {
  task: TaskDto;
}

export interface CompleteTaskResponseDto {
  task: TaskDto;
}

export interface ReorderTaskResponseDto {
  task: TaskDto;
}

export interface BulkAddTasksResponseDto {
  tasks: TaskDto[];
  created: number;
  failed: number;
  message?: string;
}
