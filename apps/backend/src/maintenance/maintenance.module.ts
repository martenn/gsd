import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RetentionJob } from './jobs/retention.job';
import { AppLogger } from '../logger/app-logger';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RetentionJob, AppLogger],
  exports: [],
})
export class MaintenanceModule {}
