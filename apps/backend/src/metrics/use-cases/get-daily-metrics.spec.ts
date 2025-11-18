import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GetDailyMetrics } from './get-daily-metrics';
import { MetricsRepository } from '../infra/metrics.repository';
import { AppLogger } from '../../logger/app-logger';
import { Task } from '@prisma/client';

describe('GetDailyMetrics', () => {
  let useCase: GetDailyMetrics;
  let repository: jest.Mocked<MetricsRepository>;
  let logger: jest.Mocked<AppLogger>;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDailyMetrics,
        {
          provide: MetricsRepository,
          useValue: {
            getCompletedTasksByDateRange: jest.fn(),
          },
        },
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<GetDailyMetrics>(GetDailyMetrics);
    repository = module.get(MetricsRepository);
    logger = module.get(AppLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userId = 'user-123';
    const baseTask: Partial<Task> = {
      id: 'task-1',
      title: 'Test Task',
      description: null,
      orderIndex: 1000,
      listId: 'list-1',
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return daily metrics with correct aggregation', async () => {
      const query = {
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        timezone: 'UTC',
      };

      const tasks: Task[] = [
        {
          ...baseTask,
          id: 'task-1',
          completedAt: new Date('2025-01-01T10:00:00Z'),
        } as Task,
        {
          ...baseTask,
          id: 'task-2',
          completedAt: new Date('2025-01-01T14:00:00Z'),
        } as Task,
        {
          ...baseTask,
          id: 'task-3',
          completedAt: new Date('2025-01-03T08:00:00Z'),
        } as Task,
      ];

      repository.getCompletedTasksByDateRange.mockResolvedValue(tasks);

      const result = await useCase.execute(userId, query);

      expect(result.metrics).toHaveLength(3);
      expect(result.metrics[0]).toEqual({
        date: '2025-01-01',
        count: 2,
        timezone: 'UTC',
      });
      expect(result.metrics[1]).toEqual({
        date: '2025-01-02',
        count: 0,
        timezone: 'UTC',
      });
      expect(result.metrics[2]).toEqual({
        date: '2025-01-03',
        count: 1,
        timezone: 'UTC',
      });
      expect(result.totalCompleted).toBe(3);
      expect(result.startDate).toBe('2025-01-01');
      expect(result.endDate).toBe('2025-01-03');
      expect(result.timezone).toBe('UTC');
    });

    it('should convert timezones correctly', async () => {
      const query = {
        startDate: '2025-01-01',
        endDate: '2025-01-01',
        timezone: 'America/New_York',
      };

      const tasks: Task[] = [
        {
          ...baseTask,
          id: 'task-1',
          completedAt: new Date('2025-01-01T23:00:00Z'),
        } as Task,
      ];

      repository.getCompletedTasksByDateRange.mockResolvedValue(tasks);

      const result = await useCase.execute(userId, query);

      expect(result.metrics[0].count).toBe(1);
      expect(result.timezone).toBe('America/New_York');
    });

    it('should fill gaps with zero counts', async () => {
      const query = {
        startDate: '2025-01-01',
        endDate: '2025-01-05',
        timezone: 'UTC',
      };

      const tasks: Task[] = [
        {
          ...baseTask,
          id: 'task-1',
          completedAt: new Date('2025-01-01T10:00:00Z'),
        } as Task,
        {
          ...baseTask,
          id: 'task-2',
          completedAt: new Date('2025-01-05T10:00:00Z'),
        } as Task,
      ];

      repository.getCompletedTasksByDateRange.mockResolvedValue(tasks);

      const result = await useCase.execute(userId, query);

      expect(result.metrics).toHaveLength(5);
      expect(result.metrics[0].count).toBe(1);
      expect(result.metrics[1].count).toBe(0);
      expect(result.metrics[2].count).toBe(0);
      expect(result.metrics[3].count).toBe(0);
      expect(result.metrics[4].count).toBe(1);
    });

    it('should handle empty task list', async () => {
      const query = {
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        timezone: 'UTC',
      };

      repository.getCompletedTasksByDateRange.mockResolvedValue([]);

      const result = await useCase.execute(userId, query);

      expect(result.metrics).toHaveLength(3);
      expect(result.metrics.every((m: { count: number }) => m.count === 0)).toBe(true);
      expect(result.totalCompleted).toBe(0);
    });

    it('should use default values when query params omitted', async () => {
      const query = {};

      repository.getCompletedTasksByDateRange.mockResolvedValue([]);

      const result = await useCase.execute(userId, query);

      expect(result.timezone).toBe('UTC');
      expect(result.metrics.length).toBeGreaterThan(0);
    });

    it('should throw BadRequestException when end date before start date', async () => {
      const query = {
        startDate: '2025-01-10',
        endDate: '2025-01-01',
        timezone: 'UTC',
      };

      await expect(useCase.execute(userId, query)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, query)).rejects.toThrow(
        'End date must be after start date',
      );
    });

    it('should throw BadRequestException when date range exceeds 1 year', async () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2025-01-02',
        timezone: 'UTC',
      };

      await expect(useCase.execute(userId, query)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, query)).rejects.toThrow(
        'Date range cannot exceed 1 year',
      );
    });

    it('should log execution start and success', async () => {
      const query = {
        startDate: '2025-01-01',
        endDate: '2025-01-01',
        timezone: 'UTC',
      };

      repository.getCompletedTasksByDateRange.mockResolvedValue([]);

      await useCase.execute(userId, query);

      expect(logger.log).toHaveBeenCalledWith(`Fetching daily metrics for user ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Returning'));
    });

    it('should log and re-throw errors', async () => {
      const query = {
        startDate: '2025-01-01',
        endDate: '2025-01-01',
        timezone: 'UTC',
      };

      const error = new Error('Database error');
      repository.getCompletedTasksByDateRange.mockRejectedValue(error);

      await expect(useCase.execute(userId, query)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch daily metrics'),
        expect.any(String),
      );
    });
  });
});
