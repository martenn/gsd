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

export function useTasksQuery(query?: GetTasksQuery) {
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: () => getTasks(query),
    staleTime: 30_000, // 30 seconds
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

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

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

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

export function useBulkAddTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkAddTasksRequest) => bulkAddTasks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
