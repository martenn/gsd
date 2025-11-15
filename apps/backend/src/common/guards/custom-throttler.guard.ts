import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const request = req as Request;
    return request.ips?.length > 0 ? request.ips[0] : request.ip;
  }

  protected throwThrottlingException(): void {
    throw new ThrottlerException('Too many requests, please try again later');
  }
}
