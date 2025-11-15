import { Injectable } from '@nestjs/common';
import { HealthStatus } from '@gsd/types';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class CheckLiveness {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(CheckLiveness.name);
  }

  execute(): HealthStatus {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor(process.uptime());

    return {
      status: 'ok',
      timestamp,
      uptime,
    };
  }
}
