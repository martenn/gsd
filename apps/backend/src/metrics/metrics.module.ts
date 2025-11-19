import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MetricsController } from './adapters/metrics.controller';
import { GetDailyMetrics } from './use-cases/get-daily-metrics';
import { GetWeeklyMetrics } from './use-cases/get-weekly-metrics';
import { MetricsRepository } from './infra/metrics.repository';
import { AppLogger } from '../logger/app-logger';

@Module({
  controllers: [MetricsController],
  providers: [
    GetDailyMetrics,
    GetWeeklyMetrics,
    MetricsRepository,
    AppLogger,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [GetDailyMetrics, GetWeeklyMetrics],
})
export class MetricsModule {}
