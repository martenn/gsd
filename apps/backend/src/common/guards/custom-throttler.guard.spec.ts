import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './custom-throttler.guard';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;

  beforeEach(() => {
    guard = new CustomThrottlerGuard(
      {
        ttl: 60000,
        limit: 10,
        ignoreUserAgents: [],
        skipIf: () => false,
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  describe('getTracker', () => {
    it('should extract IP from req.ips when behind proxy', async () => {
      const mockRequest = {
        ips: ['192.168.1.100', '10.0.0.1'],
        ip: '127.0.0.1',
      };

      const tracker = await guard['getTracker'](mockRequest);

      expect(tracker).toBe('192.168.1.100');
    });

    it('should fall back to req.ip when ips array is empty', async () => {
      const mockRequest = {
        ips: [],
        ip: '203.0.113.42',
      };

      const tracker = await guard['getTracker'](mockRequest);

      expect(tracker).toBe('203.0.113.42');
    });

    it('should fall back to req.ip when ips is not present', async () => {
      const mockRequest = {
        ip: '198.51.100.25',
      };

      const tracker = await guard['getTracker'](mockRequest as any);

      expect(tracker).toBe('198.51.100.25');
    });
  });

  describe('throwThrottlingException', () => {
    it('should throw ThrottlerException with custom message', () => {
      expect(() => guard['throwThrottlingException']()).toThrow(ThrottlerException);
      expect(() => guard['throwThrottlingException']()).toThrow(
        'Too many requests, please try again later',
      );
    });
  });
});
