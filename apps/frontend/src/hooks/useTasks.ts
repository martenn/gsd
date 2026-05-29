import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BulkAddTasksRequest,
  CreateTaskRequest,
  GetTasksQuery,
  GetTasksResponseDto,
  MoveTaskRequest,
  ReorderTaskRequest,
  UpdateTaskRequest,
} from '@gsd/types';
import {
  bulkAddTasks,
  completeTask,
  createTask,
  deleteTask,
  duplicateTask,
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
    // Optimistic: patch listId + orderIndex into every cached tasks query so
    // cross-list drops don't flash back to the source list while waiting for
    // the backend. Roll back on error.
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueriesData<GetTasksResponseDto>({ queryKey: ['tasks'] });
      queryClient.setQueriesData<GetTasksResponseDto>({ queryKey: ['tasks'] }, (old) => {
        if (!old) return old;
        const updated = old.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                listId: data.listId,
                ...(data.newOrderIndex !== undefined ? { orderIndex: data.newOrderIndex } : {}),
              }
            : t,
        );
        updated.sort((a, b) => b.orderIndex - a.orderIndex);
        return { ...old, tasks: updated };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, snapshot]) => queryClient.setQueryData(key, snapshot));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useReorderTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: ReorderTaskRequest }) =>
      reorderTask(taskId, data),
    // Optimistic: patch the new orderIndex into every cached tasks query and
    // re-sort so the UI doesn't briefly snap back to the old position while we
    // wait for the backend. Roll back on error.
    onMutate: async ({ taskId, data }) => {
      if (data.newOrderIndex === undefined) return { previous: [] as PreviousTasksSnapshot };
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueriesData<GetTasksResponseDto>({ queryKey: ['tasks'] });
      queryClient.setQueriesData<GetTasksResponseDto>({ queryKey: ['tasks'] }, (old) => {
        if (!old) return old;
        const updated = old.tasks.map((t) =>
          t.id === taskId ? { ...t, orderIndex: data.newOrderIndex! } : t,
        );
        updated.sort((a, b) => b.orderIndex - a.orderIndex);
        return { ...old, tasks: updated };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, snapshot]) => queryClient.setQueryData(key, snapshot));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

type PreviousTasksSnapshot = Array<[unknown[], GetTasksResponseDto | undefined]>;

export function useDuplicateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => duplicateTask(taskId),
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
