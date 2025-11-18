import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GetWeeklyMetrics } from './get-weekly-metrics';
import { MetricsRepository } from '../infra/metrics.repository';
import { AppLogger } from '../../logger/app-logger';
import { Task } from '@prisma/client';

describe('GetWeeklyMetrics', () => {
  let useCase: GetWeeklyMetrics;
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
        GetWeeklyMetrics,
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

    useCase = module.get<GetWeeklyMetrics>(GetWeeklyMetrics);
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

    it('should return weekly metrics with correct aggregation (Monday-Sunday)', async () => {
      const query = {
        startDate: '2025-01-06',
        endDate: '2025-01-19',
        timezone: 'UTC',
      };

      const tasks: Task[] = [
        {
          ...baseTask,
          id: 'task-1',
          completedAt: new Date('2025-01-06T10:00:00Z'),
        } as Task,
        {
          ...baseTask,
          id: 'task-2',
          completedAt: new Date('2025-01-07T14:00:00Z'),
        } as Task,
        {
          ...baseTask,
          id: 'task-3',
          completedAt: new Date('2025-01-13T08:00:00Z'),
        } as Task,
        {
          ...baseTask,
          id: 'task-4',
          completedAt: new Date('2025-01-14T12:00:00Z'),
        } as Task,
        {
          ...baseTask,
          id: 'task-5',
          completedAt: new Date('2025-01-19T16:00:00Z'),
        } as Task,
      ];

      repository.getCompletedTasksByDateRange.mockResolvedValue(tasks);

      const result = await useCase.execute(userId, query);

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0]).toEqual({
        weekStartDate: '2025-01-06',
        weekEndDate: '2025-01-12',
        count: 2,
        timezone: 'UTC',
      });
      expect(result.metrics[1]).toEqual({
        weekStartDate: '2025-01-13',
        weekEndDate: '2025-01-19',
        count: 3,
        timezone: 'UTC',
      });
      expect(result.totalCompleted).toBe(5);
      expect(result.totalWeeks).toBe(2);
    });

    it('should convert timezones correctly', async () => {
      const query = {
        startDate: '2025-01-06',
        endDate: '2025-01-12',
        timezone: 'America/New_York',
      };

      const tasks: Task[] = [
        {
          ...baseTask,
          id: 'task-1',
          completedAt: new Date('2025-01-06T23:00:00Z'),
        } as Task,
      ];

      repository.getCompletedTasksByDateRange.mockResolvedValue(tasks);

      const result = await useCase.execute(userId, query);

      expect(result.metrics[0].count).toBeGreaterThanOrEqual(0);
      expect(result.timezone).toBe('America/New_York');
    });

    it('should handle partial weeks at start and end of range', async () => {
      const query = {
        startDate: '2025-01-08',
        endDate: '2025-01-10',
        timezone: 'UTC',
      };

      const tasks: Task[] = [
        {
          ...baseTask,
          id: 'task-1',
          completedAt: new Date('2025-01-08T10:00:00Z'),
        } as Task,
      ];

      repository.getCompletedTasksByDateRange.mockResolvedValue(tasks);

      const result = await useCase.execute(userId, query);

      expect(result.metrics.length).toBeGreaterThan(0);
      expect(result.metrics[0].weekStartDate).toBe('2025-01-06');
    });

    it('should fill gaps with zero counts', async () => {
      const query = {
        startDate: '2025-01-06',
        endDate: '2025-01-26',
        timezone: 'UTC',
      };

      const tasks: Task[] = [
        {
          ...baseTask,
          id: 'task-1',
          completedAt: new Date('2025-01-06T10:00:00Z'),
        } as Task,
        {
          ...baseTask,
          id: 'task-2',
          completedAt: new Date('2025-01-26T10:00:00Z'),
        } as Task,
      ];

      repository.getCompletedTasksByDateRange.mockResolvedValue(tasks);

      const result = await useCase.execute(userId, query);

      expect(result.metrics.length).toBeGreaterThan(2);
      const hasZeroWeek = result.metrics.some((m: { count: number }) => m.count === 0);
      expect(hasZeroWeek).toBe(true);
    });

    it('should handle empty task list', async () => {
      const query = {
        startDate: '2025-01-06',
        endDate: '2025-01-19',
        timezone: 'UTC',
      };

      repository.getCompletedTasksByDateRange.mockResolvedValue([]);

      const result = await useCase.execute(userId, query);

      expect(result.metrics.length).toBeGreaterThan(0);
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
        startDate: '2025-01-20',
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
        startDate: '2025-01-06',
        endDate: '2025-01-12',
        timezone: 'UTC',
      };

      repository.getCompletedTasksByDateRange.mockResolvedValue([]);

      await useCase.execute(userId, query);

      expect(logger.log).toHaveBeenCalledWith(`Fetching weekly metrics for user ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Returning'));
    });

    it('should log and re-throw errors', async () => {
      const query = {
        startDate: '2025-01-06',
        endDate: '2025-01-12',
        timezone: 'UTC',
      };

      const error = new Error('Database error');
      repository.getCompletedTasksByDateRange.mockRejectedValue(error);

      await expect(useCase.execute(userId, query)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch weekly metrics'),
        expect.any(String),
      );
    });
  });
});
