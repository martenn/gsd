import { RetentionJob } from './retention.job';
import { PrismaClient } from '@prisma/client';
import { AppLogger } from '../../logger/app-logger';

describe('RetentionJob', () => {
  let retentionJob: RetentionJob;
  let prisma: jest.Mocked<PrismaClient>;
  let logger: jest.Mocked<AppLogger>;

  beforeEach(() => {
    prisma = {
      task: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    retentionJob = new RetentionJob(prisma, logger);
  });

  describe('execute', () => {
    it('should complete successfully when no users have excess tasks', async () => {
      prisma.task.groupBy.mockResolvedValue([]);

      await retentionJob.execute();

      expect(logger.log).toHaveBeenCalledWith('Starting retention job');
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Retention job completed: processed 0 users, deleted 0 tasks'),
      );
    });

    it('should delete old completed tasks for users with > 500 tasks', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      prisma.task.groupBy.mockResolvedValue([
        { userId: userId1, _count: { id: 600 } },
        { userId: userId2, _count: { id: 550 } },
      ]);

      const mockTasksToKeep = Array.from({ length: 500 }, (_, i) => ({
        id: `task-${i}`,
      }));

      prisma.task.findMany.mockResolvedValue(mockTasksToKeep);
      prisma.task.deleteMany
        .mockResolvedValueOnce({ count: 100 })
        .mockResolvedValueOnce({ count: 50 });

      await retentionJob.execute();

      expect(prisma.task.groupBy).toHaveBeenCalledWith({
        by: ['userId'],
        where: { completedAt: { not: null } },
        _count: { id: true },
        having: { id: { _count: { gt: 500 } } },
      });

      expect(prisma.task.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: userId1, completedAt: { not: null } },
        select: { id: true },
        orderBy: { completedAt: 'desc' },
        take: 500,
      });

      expect(prisma.task.deleteMany).toHaveBeenCalledTimes(2);
      expect(prisma.task.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: userId1,
          completedAt: { not: null },
          id: { notIn: mockTasksToKeep.map((t) => t.id) },
        },
      });

      expect(logger.log).toHaveBeenCalledWith('Deleted 100 old completed tasks for user user-1');
      expect(logger.log).toHaveBeenCalledWith('Deleted 50 old completed tasks for user user-2');
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('processed 2 users, deleted 150 tasks'),
      );
    });

    it('should handle users with exactly 500 completed tasks', async () => {
      prisma.task.groupBy.mockResolvedValue([]);

      await retentionJob.execute();

      expect(prisma.task.deleteMany).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('processed 0 users, deleted 0 tasks'),
      );
    });

    it('should continue processing other users when one user fails', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const userId3 = 'user-3';

      prisma.task.groupBy.mockResolvedValue([
        { userId: userId1, _count: { id: 600 } },
        { userId: userId2, _count: { id: 550 } },
        { userId: userId3, _count: { id: 520 } },
      ]);

      const mockTasksToKeep = Array.from({ length: 500 }, (_, i) => ({
        id: `task-${i}`,
      }));

      prisma.task.findMany.mockResolvedValue(mockTasksToKeep);
      prisma.task.deleteMany
        .mockResolvedValueOnce({ count: 100 })
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ count: 20 });

      await retentionJob.execute();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to cleanup tasks for user user-2'),
        expect.any(String),
      );
      expect(logger.log).toHaveBeenCalledWith('Deleted 100 old completed tasks for user user-1');
      expect(logger.log).toHaveBeenCalledWith('Deleted 20 old completed tasks for user user-3');
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('processed 3 users, deleted 120 tasks'),
      );
    });

    it('should log and rethrow errors during groupBy query', async () => {
      const error = new Error('Database connection failed');
      prisma.task.groupBy.mockRejectedValue(error);

      await expect(retentionJob.execute()).rejects.toThrow('Database connection failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Retention job failed: Database connection failed',
        error.stack,
      );
    });

    it('should keep the 500 most recent tasks based on completedAt', async () => {
      const userId = 'user-1';

      prisma.task.groupBy.mockResolvedValue([{ userId, _count: { id: 700 } }]);

      const mockTasksToKeep = Array.from({ length: 500 }, (_, i) => ({
        id: `recent-task-${i}`,
      }));

      prisma.task.findMany.mockResolvedValue(mockTasksToKeep);
      prisma.task.deleteMany.mockResolvedValue({ count: 200 });

      await retentionJob.execute();

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId, completedAt: { not: null } },
        select: { id: true },
        orderBy: { completedAt: 'desc' },
        take: 500,
      });

      expect(prisma.task.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          completedAt: { not: null },
          id: { notIn: mockTasksToKeep.map((t) => t.id) },
        },
      });
    });

    it('should only query completed tasks (completedAt not null)', async () => {
      prisma.task.groupBy.mockResolvedValue([]);

      await retentionJob.execute();

      expect(prisma.task.groupBy).toHaveBeenCalledWith({
        by: ['userId'],
        where: { completedAt: { not: null } },
        _count: { id: true },
        having: { id: { _count: { gt: 500 } } },
      });
    });

    it('should log execution time', async () => {
      prisma.task.groupBy.mockResolvedValue([]);

      await retentionJob.execute();

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/Retention job completed:.*in \d+ms/),
      );
    });
  });
});
