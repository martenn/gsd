import { Injectable, BadRequestException } from '@nestjs/common';
import { WeeklyMetricsResponseDto, WeeklyMetric } from '@gsd/types';
import { MetricsRepository } from '../infra/metrics.repository';
import { GetWeeklyMetricsQueryDto } from '../dto/get-weekly-metrics-query.dto';
import { AppLogger } from '../../logger/app-logger';
import { Task } from '@prisma/client';
import {
  startOfDay,
  endOfDay,
  addDays,
  differenceInDays,
  format,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

@Injectable()
export class GetWeeklyMetrics {
  constructor(
    private readonly repository: MetricsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetWeeklyMetrics.name);
  }

  async execute(
    userId: string,
    query: GetWeeklyMetricsQueryDto,
  ): Promise<WeeklyMetricsResponseDto> {
    this.logger.log(`Fetching weekly metrics for user ${userId}`);

    try {
      const timezone = query.timezone || 'UTC';
      const endDate = query.endDate || format(new Date(), 'yyyy-MM-dd');
      const startDate = query.startDate || format(addDays(new Date(endDate), -84), 'yyyy-MM-dd');

      this.validateDateRange(startDate, endDate);

      const utcStart = this.convertToUTCStart(startDate, timezone);
      const utcEnd = this.convertToUTCEnd(endDate, timezone);

      const tasks = await this.repository.getCompletedTasksByDateRange(userId, utcStart, utcEnd);

      const metrics = this.aggregateByWeek(tasks, startDate, endDate, timezone);

      this.logger.log(`Returning ${metrics.length} weekly metrics for user ${userId}`);

      return {
        metrics,
        startDate,
        endDate,
        timezone,
        totalCompleted: tasks.length,
        totalWeeks: metrics.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch weekly metrics for user ${userId}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    const daysDiff = differenceInDays(end, start);
    if (daysDiff > 365) {
      throw new BadRequestException('Date range cannot exceed 1 year');
    }
  }

  private convertToUTCStart(dateStr: string, timezone: string): Date {
    const localDate = new Date(dateStr);
    const startOfDayLocal = startOfDay(localDate);
    return fromZonedTime(startOfDayLocal, timezone);
  }

  private convertToUTCEnd(dateStr: string, timezone: string): Date {
    const localDate = new Date(dateStr);
    const endOfDayLocal = endOfDay(localDate);
    return fromZonedTime(endOfDayLocal, timezone);
  }

  private getMonday(date: Date): Date {
    return startOfWeek(date, { weekStartsOn: 1 });
  }

  private getSunday(mondayDate: Date): Date {
    return endOfWeek(mondayDate, { weekStartsOn: 1 });
  }

  private aggregateByWeek(
    tasks: Task[],
    startDate: string,
    endDate: string,
    timezone: string,
  ): WeeklyMetric[] {
    const weeklyMap = new Map<string, { start: string; end: string; count: number }>();

    for (const task of tasks) {
      if (!task.completedAt) continue;

      const localDate = toZonedTime(task.completedAt, timezone);
      const weekStart = this.getMonday(localDate);
      const weekEnd = this.getSunday(weekStart);
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          start: weekKey,
          end: format(weekEnd, 'yyyy-MM-dd'),
          count: 0,
        });
      }

      const existing = weeklyMap.get(weekKey);
      if (existing) {
        existing.count += 1;
      }
    }

    const metrics: WeeklyMetric[] = [];
    let currentWeekStart = this.getMonday(new Date(startDate));
    const endDateObj = new Date(endDate);

    while (currentWeekStart <= endDateObj) {
      const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
      const weekEnd = this.getSunday(currentWeekStart);

      const existing = weeklyMap.get(weekKey);

      metrics.push({
        weekStartDate: weekKey,
        weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
        count: existing?.count || 0,
        timezone,
      });

      currentWeekStart = addDays(currentWeekStart, 7);
    }

    return metrics;
  }
}
