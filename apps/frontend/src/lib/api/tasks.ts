import type {
  BulkAddTasksRequest,
  BulkAddTasksResponseDto,
  CompleteTaskResponseDto,
  CreateTaskRequest,
  CreateTaskResponseDto,
  GetTasksQuery,
  GetTasksResponseDto,
  MoveTaskRequest,
  MoveTaskResponseDto,
  ReorderTaskRequest,
  ReorderTaskResponseDto,
  UpdateTaskRequest,
  UpdateTaskResponseDto,
} from '@gsd/types';
import { apiClient } from './client';

export async function getTasks(query?: GetTasksQuery): Promise<GetTasksResponseDto> {
  const params = new URLSearchParams();

  if (query?.listId) params.append('listId', query.listId);
  if (query?.includeCompleted !== undefined)
    params.append('includeCompleted', String(query.includeCompleted));
  if (query?.limit) params.append('limit', String(query.limit));
  if (query?.offset) params.append('offset', String(query.offset));

  const queryString = params.toString();
  const path = queryString ? `/v1/tasks?${queryString}` : '/v1/tasks';

  const result = await apiClient.get<GetTasksResponseDto>(path);
  if (!result) {
    throw new Error('Failed to fetch tasks');
  }
  return result;
}

export async function createTask(data: CreateTaskRequest): Promise<CreateTaskResponseDto> {
  const result = await apiClient.post<CreateTaskResponseDto>('/v1/tasks', data);
  if (!result) {
    throw new Error('Failed to create task');
  }
  return result;
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskRequest,
): Promise<UpdateTaskResponseDto> {
  const result = await apiClient.patch<UpdateTaskResponseDto>(`/v1/tasks/${taskId}`, data);
  if (!result) {
    throw new Error('Failed to update task');
  }
  return result;
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/v1/tasks/${taskId}`);
}

export async function moveTask(
  taskId: string,
  data: MoveTaskRequest,
): Promise<MoveTaskResponseDto> {
  const result = await apiClient.post<MoveTaskResponseDto>(`/v1/tasks/${taskId}/move`, data);
  if (!result) {
    throw new Error('Failed to move task');
  }
  return result;
}

export async function reorderTask(
  taskId: string,
  data: ReorderTaskRequest,
): Promise<ReorderTaskResponseDto> {
  const result = await apiClient.post<ReorderTaskResponseDto>(`/v1/tasks/${taskId}/reorder`, data);
  if (!result) {
    throw new Error('Failed to reorder task');
  }
  return result;
}

export async function completeTask(taskId: string): Promise<CompleteTaskResponseDto> {
  const result = await apiClient.post<CompleteTaskResponseDto>(`/v1/tasks/${taskId}/complete`);
  if (!result) {
    throw new Error('Failed to complete task');
  }
  return result;
}

export async function bulkAddTasks(data: BulkAddTasksRequest): Promise<BulkAddTasksResponseDto> {
  const result = await apiClient.post<BulkAddTasksResponseDto>('/v1/tasks/bulk-add', data);
  if (!result) {
    throw new Error('Failed to bulk add tasks');
  }
  return result;
}
