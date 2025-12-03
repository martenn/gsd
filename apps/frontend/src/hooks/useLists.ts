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

export function useListsQuery() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: getLists,
    staleTime: 30_000, // 30 seconds
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateListRequest) => createList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

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

export function useToggleBacklog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => toggleBacklog(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

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
