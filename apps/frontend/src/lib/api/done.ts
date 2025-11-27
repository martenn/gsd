import type { GetDoneQuery, GetDoneResponseDto } from '@gsd/types';
import { apiClient } from './client';

/**
 * Fetch completed tasks with pagination
 */
export async function getDoneTasks(query?: GetDoneQuery): Promise<GetDoneResponseDto> {
  const params = new URLSearchParams();

  if (query?.limit) params.append('limit', String(query.limit));
  if (query?.offset) params.append('offset', String(query.offset));

  const queryString = params.toString();
  const path = queryString ? `/v1/done?${queryString}` : '/v1/done';

  const result = await apiClient.get<GetDoneResponseDto>(path);
  if (!result) {
    throw new Error('Failed to fetch completed tasks');
  }
  return result;
}
