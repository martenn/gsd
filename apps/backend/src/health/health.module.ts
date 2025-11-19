import { Module } from '@nestjs/common';
import { AppLogger } from '../logger/app-logger';
import { HealthController } from './adapters/health.controller';
import { HealthRepository } from './infra/health.repository';
import { CheckLiveness } from './use-cases/check-liveness';
import { CheckReadiness } from './use-cases/check-readiness';

@Module({
  controllers: [HealthController],
  providers: [CheckLiveness, CheckReadiness, HealthRepository, AppLogger],
  exports: [],
})
export class HealthModule {}
