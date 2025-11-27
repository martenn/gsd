import type {
  CreateListRequest,
  GetListsResponseDto,
  ListDto,
  ReorderListRequest,
  ReorderListResponseDto,
  ToggleBacklogResponseDto,
  UpdateListRequest,
  UpdateListResponseDto,
} from '@gsd/types';
import { apiClient } from './client';

/**
 * Fetch all lists for the current user
 */
export async function getLists(): Promise<GetListsResponseDto> {
  const result = await apiClient.get<GetListsResponseDto>('/v1/lists');
  if (!result) {
    throw new Error('Failed to fetch lists');
  }
  return result;
}

/**
 * Create a new list
 */
export async function createList(data: CreateListRequest): Promise<ListDto> {
  const result = await apiClient.post<ListDto>('/v1/lists', data);
  if (!result) {
    throw new Error('Failed to create list');
  }
  return result;
}

/**
 * Update a list's name
 */
export async function updateList(
  listId: string,
  data: UpdateListRequest,
): Promise<UpdateListResponseDto> {
  const result = await apiClient.patch<UpdateListResponseDto>(`/v1/lists/${listId}`, data);
  if (!result) {
    throw new Error('Failed to update list');
  }
  return result;
}

/**
 * Delete a list and move its tasks to a destination list
 */
export async function deleteList(listId: string, destinationListId: string): Promise<void> {
  await apiClient.delete(`/v1/lists/${listId}?destinationListId=${destinationListId}`);
}

/**
 * Toggle a list's backlog status
 */
export async function toggleBacklog(listId: string): Promise<ToggleBacklogResponseDto> {
  const result = await apiClient.post<ToggleBacklogResponseDto>(
    `/v1/lists/${listId}/toggle-backlog`,
  );
  if (!result) {
    throw new Error('Failed to toggle backlog status');
  }
  return result;
}

/**
 * Reorder a list
 */
export async function reorderList(
  listId: string,
  data: ReorderListRequest,
): Promise<ReorderListResponseDto> {
  const result = await apiClient.post<ReorderListResponseDto>(`/v1/lists/${listId}/reorder`, data);
  if (!result) {
    throw new Error('Failed to reorder list');
  }
  return result;
}
