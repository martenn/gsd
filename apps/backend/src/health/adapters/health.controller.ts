import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { HealthStatus, ReadinessStatus } from '@gsd/types';
import { CheckLiveness } from '../use-cases/check-liveness';
import { CheckReadiness } from '../use-cases/check-readiness';

@Controller('health')
export class HealthController {
  constructor(
    private readonly checkLivenessUseCase: CheckLiveness,
    private readonly checkReadinessUseCase: CheckReadiness,
  ) {}

  @Get()
  getLiveness(): HealthStatus {
    return this.checkLivenessUseCase.execute();
  }

  @Get('ready')
  async getReadiness(@Res() response: Response): Promise<Response> {
    const readiness = await this.checkReadinessUseCase.execute();

    const statusCode =
      readiness.status === 'ready' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return response.status(statusCode).json(readiness);
  }
}
