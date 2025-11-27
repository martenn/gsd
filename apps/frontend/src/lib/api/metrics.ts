import type {
  DailyMetricsResponseDto,
  GetDailyMetricsQuery,
  GetWeeklyMetricsQuery,
  WeeklyMetricsResponseDto,
} from '@gsd/types';
import { apiClient } from './client';

/**
 * Fetch daily task completion metrics
 */
export async function getDailyMetrics(
  query?: GetDailyMetricsQuery,
): Promise<DailyMetricsResponseDto> {
  const params = new URLSearchParams();

  if (query?.startDate) params.append('startDate', query.startDate);
  if (query?.endDate) params.append('endDate', query.endDate);
  if (query?.timezone) params.append('timezone', query.timezone);

  const queryString = params.toString();
  const path = queryString ? `/v1/metrics/daily?${queryString}` : '/v1/metrics/daily';

  const result = await apiClient.get<DailyMetricsResponseDto>(path);
  if (!result) {
    throw new Error('Failed to fetch daily metrics');
  }
  return result;
}

/**
 * Fetch weekly task completion metrics
 */
export async function getWeeklyMetrics(
  query?: GetWeeklyMetricsQuery,
): Promise<WeeklyMetricsResponseDto> {
  const params = new URLSearchParams();

  if (query?.startDate) params.append('startDate', query.startDate);
  if (query?.endDate) params.append('endDate', query.endDate);
  if (query?.timezone) params.append('timezone', query.timezone);

  const queryString = params.toString();
  const path = queryString ? `/v1/metrics/weekly?${queryString}` : '/v1/metrics/weekly';

  const result = await apiClient.get<WeeklyMetricsResponseDto>(path);
  if (!result) {
    throw new Error('Failed to fetch weekly metrics');
  }
  return result;
}
