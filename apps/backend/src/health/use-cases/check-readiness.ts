import { Injectable } from '@nestjs/common';
import { ReadinessStatus } from '@gsd/types';
import { HealthRepository } from '../infra/health.repository';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class CheckReadiness {
  constructor(
    private readonly repository: HealthRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CheckReadiness.name);
  }

  async execute(): Promise<ReadinessStatus> {
    const timestamp = new Date().toISOString();

    try {
      const isDatabaseUp = await this.repository.pingDatabase();

      if (!isDatabaseUp) {
        this.logger.error('Database connectivity check failed');
      }

      return {
        status: isDatabaseUp ? 'ready' : 'not_ready',
        timestamp,
        checks: {
          database: isDatabaseUp ? 'up' : 'down',
        },
      };
    } catch (error) {
      this.logger.error(
        `Readiness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        status: 'not_ready',
        timestamp,
        checks: {
          database: 'down',
        },
      };
    }
  }
}
