import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BulkAddTasksRequest,
  CreateTaskRequest,
  GetTasksQuery,
  MoveTaskRequest,
  ReorderTaskRequest,
  UpdateTaskRequest,
} from '@gsd/types';
import {
  bulkAddTasks,
  completeTask,
  createTask,
  deleteTask,
  getTasks,
  moveTask,
  reorderTask,
  updateTask,
} from '../lib/api/tasks';

/**
 * Fetch tasks with optional filtering
 */
export function useTasksQuery(query?: GetTasksQuery) {
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: () => getTasks(query),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Update a task's title or description
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequest }) =>
      updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Move a task to a different list
 */
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: MoveTaskRequest }) =>
      moveTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Reorder a task within its list
 */
export function useReorderTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: ReorderTaskRequest }) =>
      reorderTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Mark a task as complete
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['done'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

/**
 * Bulk add tasks (dump mode)
 */
export function useBulkAddTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkAddTasksRequest) => bulkAddTasks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
