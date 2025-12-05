export interface MetricsSummary {
  todayCount: number;
  thisWeekCount: number;
  lastWeekCount: number;
  timezone: string;
}

export interface TimestampDisplay {
  relative: string;
  absolute: string;
  useRelative: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
