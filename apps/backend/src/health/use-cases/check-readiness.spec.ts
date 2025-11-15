import { CheckReadiness } from './check-readiness';
import { HealthRepository } from '../infra/health.repository';
import { AppLogger } from '../../logger/app-logger';

describe('CheckReadiness', () => {
  let checkReadiness: CheckReadiness;
  let repository: jest.Mocked<HealthRepository>;
  let logger: jest.Mocked<AppLogger>;

  beforeEach(() => {
    repository = {
      pingDatabase: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    checkReadiness = new CheckReadiness(repository, logger);
  });

  describe('execute', () => {
    it('should return ready status when database is up', async () => {
      repository.pingDatabase.mockResolvedValue(true);

      const result = await checkReadiness.execute();

      expect(result.status).toBe('ready');
      expect(result.checks.database).toBe('up');
      expect(repository.pingDatabase).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return not_ready status when database is down', async () => {
      repository.pingDatabase.mockResolvedValue(false);

      const result = await checkReadiness.execute();

      expect(result.status).toBe('not_ready');
      expect(result.checks.database).toBe('down');
      expect(repository.pingDatabase).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Database connectivity check failed');
    });

    it('should return current timestamp in ISO format', async () => {
      repository.pingDatabase.mockResolvedValue(true);

      const beforeTimestamp = new Date().toISOString();
      const result = await checkReadiness.execute();
      const afterTimestamp = new Date().toISOString();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.timestamp >= beforeTimestamp).toBe(true);
      expect(result.timestamp <= afterTimestamp).toBe(true);
    });

    it('should handle unexpected errors and return not_ready', async () => {
      const error = new Error('Unexpected database error');
      repository.pingDatabase.mockRejectedValue(error);

      const result = await checkReadiness.execute();

      expect(result.status).toBe('not_ready');
      expect(result.checks.database).toBe('down');
      expect(logger.error).toHaveBeenCalledWith(
        'Readiness check failed: Unexpected database error',
        error.stack,
      );
    });

    it('should handle non-Error exceptions', async () => {
      repository.pingDatabase.mockRejectedValue('String error');

      const result = await checkReadiness.execute();

      expect(result.status).toBe('not_ready');
      expect(result.checks.database).toBe('down');
      expect(logger.error).toHaveBeenCalledWith('Readiness check failed: Unknown error', undefined);
    });
  });
});
