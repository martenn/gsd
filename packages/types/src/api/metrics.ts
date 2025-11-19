export interface DailyMetric {
  date: string;
  count: number;
  timezone: string;
}

export interface WeeklyMetric {
  weekStartDate: string;
  weekEndDate: string;
  count: number;
  timezone: string;
}

export interface GetDailyMetricsQuery {
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface GetWeeklyMetricsQuery {
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface DailyMetricsResponseDto {
  metrics: DailyMetric[];
  startDate: string;
  endDate: string;
  timezone: string;
  totalCompleted: number;
}

export interface WeeklyMetricsResponseDto {
  metrics: WeeklyMetric[];
  startDate: string;
  endDate: string;
  timezone: string;
  totalCompleted: number;
  totalWeeks: number;
}
