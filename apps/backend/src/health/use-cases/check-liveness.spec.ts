import { CheckLiveness } from './check-liveness';
import { AppLogger } from '../../logger/app-logger';

describe('CheckLiveness', () => {
  let checkLiveness: CheckLiveness;
  let logger: jest.Mocked<AppLogger>;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    checkLiveness = new CheckLiveness(logger);
  });

  describe('execute', () => {
    it('should return health status with ok status', () => {
      const result = checkLiveness.execute();

      expect(result.status).toBe('ok');
    });

    it('should return current timestamp in ISO format', () => {
      const beforeTimestamp = new Date().toISOString();
      const result = checkLiveness.execute();
      const afterTimestamp = new Date().toISOString();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.timestamp >= beforeTimestamp).toBe(true);
      expect(result.timestamp <= afterTimestamp).toBe(true);
    });

    it('should return process uptime as positive integer', () => {
      const result = checkLiveness.execute();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.uptime)).toBe(true);
    });
  });
});
