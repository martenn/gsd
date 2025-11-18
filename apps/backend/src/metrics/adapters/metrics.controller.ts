import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DailyMetricsResponseDto, WeeklyMetricsResponseDto } from '@gsd/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/dto/jwt-user.dto';
import { GetDailyMetrics } from '../use-cases/get-daily-metrics';
import { GetWeeklyMetrics } from '../use-cases/get-weekly-metrics';
import { GetDailyMetricsQueryDto } from '../dto/get-daily-metrics-query.dto';
import { GetWeeklyMetricsQueryDto } from '../dto/get-weekly-metrics-query.dto';

@Controller('v1/metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(
    private readonly getDailyMetricsUseCase: GetDailyMetrics,
    private readonly getWeeklyMetricsUseCase: GetWeeklyMetrics,
  ) {}

  @Get('daily')
  async getDailyMetrics(
    @CurrentUser() user: JwtUser,
    @Query() query: GetDailyMetricsQueryDto,
  ): Promise<DailyMetricsResponseDto> {
    return this.getDailyMetricsUseCase.execute(user.id, query);
  }

  @Get('weekly')
  async getWeeklyMetrics(
    @CurrentUser() user: JwtUser,
    @Query() query: GetWeeklyMetricsQueryDto,
  ): Promise<WeeklyMetricsResponseDto> {
    return this.getWeeklyMetricsUseCase.execute(user.id, query);
  }
}
