import { Injectable, BadRequestException } from '@nestjs/common';
import { DailyMetricsResponseDto, DailyMetric } from '@gsd/types';
import { MetricsRepository } from '../infra/metrics.repository';
import { GetDailyMetricsQueryDto } from '../dto/get-daily-metrics-query.dto';
import { AppLogger } from '../../logger/app-logger';
import { Task } from '@prisma/client';
import { startOfDay, endOfDay, addDays, differenceInDays, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

@Injectable()
export class GetDailyMetrics {
  constructor(
    private readonly repository: MetricsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetDailyMetrics.name);
  }

  async execute(userId: string, query: GetDailyMetricsQueryDto): Promise<DailyMetricsResponseDto> {
    this.logger.log(`Fetching daily metrics for user ${userId}`);

    try {
      const timezone = query.timezone || 'UTC';
      const endDate = query.endDate || format(new Date(), 'yyyy-MM-dd');
      const startDate = query.startDate || format(addDays(new Date(endDate), -30), 'yyyy-MM-dd');

      this.validateDateRange(startDate, endDate);

      const utcStart = this.convertToUTCStart(startDate, timezone);
      const utcEnd = this.convertToUTCEnd(endDate, timezone);

      const tasks = await this.repository.getCompletedTasksByDateRange(userId, utcStart, utcEnd);

      const metrics = this.aggregateByDay(tasks, startDate, endDate, timezone);

      this.logger.log(`Returning ${metrics.length} daily metrics for user ${userId}`);

      return {
        metrics,
        startDate,
        endDate,
        timezone,
        totalCompleted: tasks.length,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch daily metrics for user ${userId}`, error.stack);
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

  private aggregateByDay(
    tasks: Task[],
    startDate: string,
    endDate: string,
    timezone: string,
  ): DailyMetric[] {
    const dailyMap = new Map<string, number>();

    for (const task of tasks) {
      if (!task.completedAt) continue;

      const localDate = toZonedTime(task.completedAt, timezone);
      const dateKey = format(localDate, 'yyyy-MM-dd');

      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
    }

    const metrics: DailyMetric[] = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');

      metrics.push({
        date: dateKey,
        count: dailyMap.get(dateKey) || 0,
        timezone,
      });

      currentDate = addDays(currentDate, 1);
    }

    return metrics;
  }
}
