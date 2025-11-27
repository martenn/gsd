import { useQuery } from '@tanstack/react-query';
import type { GetDailyMetricsQuery, GetWeeklyMetricsQuery } from '@gsd/types';
import { getDailyMetrics, getWeeklyMetrics } from '../lib/api/metrics';

/**
 * Fetch daily task completion metrics
 */
export function useDailyMetricsQuery(query?: GetDailyMetricsQuery) {
  return useQuery({
    queryKey: ['metrics', 'daily', query],
    queryFn: () => getDailyMetrics(query),
    staleTime: 60_000, // 60 seconds (metrics don't change often)
  });
}

/**
 * Fetch weekly task completion metrics
 */
export function useWeeklyMetricsQuery(query?: GetWeeklyMetricsQuery) {
  return useQuery({
    queryKey: ['metrics', 'weekly', query],
    queryFn: () => getWeeklyMetrics(query),
    staleTime: 60_000, // 60 seconds
  });
}
