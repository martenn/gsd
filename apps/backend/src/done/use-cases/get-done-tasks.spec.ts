import { GetDoneTasks } from './get-done-tasks';
import { DoneRepository } from '../infra/done.repository';
import { AppLogger } from '../../logger/app-logger';

describe('GetDoneTasks', () => {
  let getDoneTasks: GetDoneTasks;
  let repository: jest.Mocked<DoneRepository>;
  let logger: jest.Mocked<AppLogger>;

  const userId = 'user-123';

  beforeEach(() => {
    repository = {
      findCompletedTasks: jest.fn(),
      countCompletedTasks: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    getDoneTasks = new GetDoneTasks(repository, logger);
  });

  describe('execute', () => {
    const mockBacklog = {
      id: 'backlog-1',
      userId,
      name: 'Main Backlog',
      isDone: false,
      isBacklog: true,
      orderIndex: 1,
      color: '#22C55E',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCompletedTasks = [
      {
        id: 'task-1',
        userId,
        listId: 'list-1',
        originBacklogId: 'backlog-1',
        title: 'Completed Task 1',
        description: 'Description 1',
        orderIndex: 1000,
        completedAt: new Date('2025-11-13T10:00:00Z'),
        createdAt: new Date('2025-11-10T10:00:00Z'),
        updatedAt: new Date('2025-11-13T10:00:00Z'),
        list: {
          id: 'list-1',
          userId,
          name: 'Done',
          isDone: true,
          isBacklog: false,
          orderIndex: 3,
          color: '#22C55E',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        originBacklog: mockBacklog,
      },
      {
        id: 'task-2',
        userId,
        listId: 'list-1',
        originBacklogId: 'backlog-1',
        title: 'Completed Task 2',
        description: null,
        orderIndex: 2000,
        completedAt: new Date('2025-11-12T15:30:00Z'),
        createdAt: new Date('2025-11-11T10:00:00Z'),
        updatedAt: new Date('2025-11-12T15:30:00Z'),
        list: {
          id: 'list-1',
          userId,
          name: 'Done',
          isDone: true,
          isBacklog: false,
          orderIndex: 3,
          color: '#22C55E',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        originBacklog: mockBacklog,
      },
    ];

    it('should get completed tasks with default pagination', async () => {
      const query = {};

      repository.findCompletedTasks.mockResolvedValue(mockCompletedTasks);
      repository.countCompletedTasks.mockResolvedValue(2);

      const result = await getDoneTasks.execute(userId, query);

      expect(result).toEqual({
        tasks: [
          expect.objectContaining({
            id: 'task-1',
            title: 'Completed Task 1',
            description: 'Description 1',
            listId: 'list-1',
            listName: 'Done',
            color: '#22C55E',
            originBacklogId: 'backlog-1',
          }),
          expect.objectContaining({
            id: 'task-2',
            title: 'Completed Task 2',
            description: null,
            listId: 'list-1',
            listName: 'Done',
            color: '#22C55E',
            originBacklogId: 'backlog-1',
          }),
        ],
        total: 2,
        limit: 50,
        offset: 0,
      });

      expect(repository.findCompletedTasks).toHaveBeenCalledWith(userId, 50, 0);
      expect(repository.countCompletedTasks).toHaveBeenCalledWith(userId);
      expect(logger.log).toHaveBeenCalledWith(
        `Fetching completed tasks for user ${userId}, limit: 50, offset: 0`,
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Found 2 completed tasks (total: 2) for user ${userId}`,
      );
    });

    it('should apply custom limit and offset', async () => {
      const query = { limit: 20, offset: 10 };

      repository.findCompletedTasks.mockResolvedValue(mockCompletedTasks);
      repository.countCompletedTasks.mockResolvedValue(100);

      const result = await getDoneTasks.execute(userId, query);

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(10);
      expect(result.total).toBe(100);

      expect(repository.findCompletedTasks).toHaveBeenCalledWith(userId, 20, 10);
      expect(logger.log).toHaveBeenCalledWith(
        `Fetching completed tasks for user ${userId}, limit: 20, offset: 10`,
      );
    });

    it('should return empty tasks array when no completed tasks exist', async () => {
      const query = {};

      repository.findCompletedTasks.mockResolvedValue([]);
      repository.countCompletedTasks.mockResolvedValue(0);

      const result = await getDoneTasks.execute(userId, query);

      expect(result).toEqual({
        tasks: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      expect(logger.log).toHaveBeenCalledWith(
        `Found 0 completed tasks (total: 0) for user ${userId}`,
      );
    });

    it('should return empty tasks array when offset is beyond available data', async () => {
      const query = { limit: 50, offset: 200 };

      repository.findCompletedTasks.mockResolvedValue([]);
      repository.countCompletedTasks.mockResolvedValue(100);

      const result = await getDoneTasks.execute(userId, query);

      expect(result).toEqual({
        tasks: [],
        total: 100,
        limit: 50,
        offset: 200,
      });

      expect(repository.findCompletedTasks).toHaveBeenCalledWith(userId, 50, 200);
    });

    it('should handle tasks with null origin backlog color by providing default', async () => {
      const tasksWithNullColor = [
        {
          ...mockCompletedTasks[0],
          originBacklog: {
            ...mockBacklog,
            color: null,
          },
        },
      ];

      repository.findCompletedTasks.mockResolvedValue(tasksWithNullColor);
      repository.countCompletedTasks.mockResolvedValue(1);

      const result = await getDoneTasks.execute(userId, {});

      expect(result.tasks[0].color).toBe('#3B82F6');
    });

    it('should log and rethrow errors', async () => {
      const query = {};
      const error = new Error('Database error');

      repository.findCompletedTasks.mockRejectedValue(error);

      await expect(getDoneTasks.execute(userId, query)).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith(
        `Failed to fetch completed tasks for user ${userId}: Database error`,
        error.stack,
      );
    });

    it('should fetch tasks and count in parallel', async () => {
      const query = { limit: 25, offset: 5 };

      repository.findCompletedTasks.mockResolvedValue(mockCompletedTasks);
      repository.countCompletedTasks.mockResolvedValue(50);

      await getDoneTasks.execute(userId, query);

      expect(repository.findCompletedTasks).toHaveBeenCalledWith(userId, 25, 5);
      expect(repository.countCompletedTasks).toHaveBeenCalledWith(userId);
    });
  });
});
