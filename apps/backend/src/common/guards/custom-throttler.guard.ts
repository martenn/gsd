import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Request } from 'express';
// Import Express type augmentations (adds id and user properties to Request)
import '../types/express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // Parent class requires async signature, even though we don't await anything
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as Request;
    const ip = request.ips?.length > 0 ? request.ips[0] : request.ip;
    return ip || 'unknown';
  }

  // Parent class requires async signature, even though we don't await anything
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async throwThrottlingException(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException('Too many requests, please try again later');
  }
}
