import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { RetentionJob } from './jobs/retention.job';
import { AppLogger } from '../logger/app-logger';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RetentionJob, PrismaClient, AppLogger],
  exports: [],
})
export class MaintenanceModule {}
