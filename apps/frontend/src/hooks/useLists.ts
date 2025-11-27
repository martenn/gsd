import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateListRequest, ReorderListRequest, UpdateListRequest } from '@gsd/types';
import {
  createList,
  deleteList,
  getLists,
  reorderList,
  toggleBacklog,
  updateList,
} from '../lib/api/lists';

/**
 * Fetch all lists for the current user
 */
export function useListsQuery() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: getLists,
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Create a new list
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateListRequest) => createList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

/**
 * Update a list's name
 */
export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: UpdateListRequest }) =>
      updateList(listId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

/**
 * Delete a list and move its tasks
 */
export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, destinationListId }: { listId: string; destinationListId: string }) =>
      deleteList(listId, destinationListId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Toggle a list's backlog status
 */
export function useToggleBacklog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => toggleBacklog(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

/**
 * Reorder a list
 */
export function useReorderList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: ReorderListRequest }) =>
      reorderList(listId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}
