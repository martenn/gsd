import { useQuery } from '@tanstack/react-query';
import type { GetDoneQuery } from '@gsd/types';
import { getDoneTasks } from '../lib/api/done';

/**
 * Fetch completed tasks with pagination
 */
export function useDoneQuery(query?: GetDoneQuery) {
  return useQuery({
    queryKey: ['done', query],
    queryFn: () => getDoneTasks(query),
    staleTime: 30_000, // 30 seconds
  });
}
