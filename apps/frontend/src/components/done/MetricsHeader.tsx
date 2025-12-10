import { format, startOfWeek, subWeeks } from 'date-fns';
import { useDailyMetricsQuery, useWeeklyMetricsQuery } from '../../hooks/useMetrics';
import { useTimezoneDetection } from '../../hooks/useTimezoneDetection';
import { MetricBadge } from './MetricBadge';
import { Skeleton } from '../ui/skeleton';

export function MetricsHeader() {
  const timezone = useTimezoneDetection();

  const today = format(new Date(), 'yyyy-MM-dd');
  const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const lastWeekStart = format(
    startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
    'yyyy-MM-dd',
  );

  const { data: dailyData, isLoading: dailyLoading } = useDailyMetricsQuery({
    startDate: today,
    endDate: today,
    timezone,
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyMetricsQuery({
    startDate: lastWeekStart,
    endDate: today,
    timezone,
  });

  const isLoading = dailyLoading || weeklyLoading;

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-3 pb-6 border-b border-border"
        role="status"
        aria-label="Loading metrics"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-32" />
        ))}
      </div>
    );
  }

  const todayCount = dailyData?.metrics[0]?.count ?? 0;
  const thisWeekCount =
    weeklyData?.metrics.find((m) => m.weekStartDate === thisWeekStart)?.count ?? 0;
  const lastWeekCount =
    weeklyData?.metrics.find((m) => m.weekStartDate === lastWeekStart)?.count ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3 pb-4 md:pb-6 border-b border-border">
      <MetricBadge label="Today" count={todayCount} />
      <MetricBadge label="This Week" count={thisWeekCount} />
      <MetricBadge label="Last Week" count={lastWeekCount} />
    </div>
  );
}
