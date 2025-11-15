import { HealthRepository } from './health.repository';
import { PrismaClient } from '@prisma/client';

describe('HealthRepository', () => {
  let repository: HealthRepository;
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn(),
    } as any;

    repository = new HealthRepository(prisma);
  });

  describe('pingDatabase', () => {
    it('should return true when database query succeeds', async () => {
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await repository.pingDatabase();

      expect(result).toBe(true);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return false when database query fails', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await repository.pingDatabase();

      expect(result).toBe(false);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return false when database query throws non-Error exception', async () => {
      prisma.$queryRaw.mockRejectedValue('String error');

      const result = await repository.pingDatabase();

      expect(result).toBe(false);
    });
  });
});
