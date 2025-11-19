import { Test, TestingModule } from '@nestjs/testing';
import { TaskMapper } from './task.mapper';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';
import { Task, List } from '@prisma/client';

describe('TaskMapper', () => {
  let mapper: TaskMapper;
  let listsRepository: jest.Mocked<ListsRepository>;
  let logger: jest.Mocked<AppLogger>;

  const mockTask: Task = {
    id: 'task-1',
    userId: 'user-1',
    listId: 'list-1',
    originBacklogId: 'backlog-1',
    title: 'Test Task',
    description: 'Test Description',
    orderIndex: 1000,
    completedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockBacklog: List = {
    id: 'backlog-1',
    name: 'Main Backlog',
    userId: 'user-1',
    orderIndex: 1000,
    isBacklog: true,
    isDone: false,
    color: '#FF5733',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskMapper,
        {
          provide: ListsRepository,
          useValue: {
            findById: jest.fn(),
            findManyByIds: jest.fn(),
          },
        },
        {
          provide: AppLogger,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    mapper = module.get<TaskMapper>(TaskMapper);
    listsRepository = module.get(ListsRepository);
    logger = module.get(AppLogger);
  });

  describe('toDto', () => {
    it('should map task with valid origin backlog and color', async () => {
      listsRepository.findById.mockResolvedValue(mockBacklog);

      const result = await mapper.toDto(mockTask);

      expect(result).toEqual({
        id: 'task-1',
        userId: 'user-1',
        listId: 'list-1',
        originBacklogId: 'backlog-1',
        title: 'Test Task',
        description: 'Test Description',
        orderIndex: 1000,
        color: '#FF5733',
        isCompleted: false,
        createdAt: mockTask.createdAt,
        completedAt: null,
      });
      expect(listsRepository.findById).toHaveBeenCalledWith('user-1', 'backlog-1');
    });

    it('should use default color when origin backlog has no color', async () => {
      const backlogWithoutColor = { ...mockBacklog, color: null };
      listsRepository.findById.mockResolvedValue(backlogWithoutColor);

      const result = await mapper.toDto(mockTask);

      expect(result.color).toBe('#3B82F6');
      expect(logger.warn).toHaveBeenCalledWith(
        'No origin backlog color found, using default: #3B82F6',
      );
    });

    it('should use default color when origin backlog not found', async () => {
      listsRepository.findById.mockResolvedValue(null);

      const result = await mapper.toDto(mockTask);

      expect(result.color).toBe('#3B82F6');
      expect(result.originBacklogId).toBe('backlog-1');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should fallback to listId when originBacklogId is null', async () => {
      const taskWithoutOrigin = { ...mockTask, originBacklogId: null };

      const result = await mapper.toDto(taskWithoutOrigin);

      expect(result.originBacklogId).toBe('list-1');
      expect(result.color).toBe('#3B82F6');
    });

    it('should set isCompleted to true when completedAt is set', async () => {
      const completedTask = { ...mockTask, completedAt: new Date('2025-01-15') };
      listsRepository.findById.mockResolvedValue(mockBacklog);

      const result = await mapper.toDto(completedTask);

      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toEqual(completedTask.completedAt);
    });
  });

  describe('toDtoWithOrigin', () => {
    it('should map task with preloaded origin backlog', () => {
      const taskWithOrigin = { ...mockTask, originBacklog: mockBacklog };

      const result = mapper.toDtoWithOrigin(taskWithOrigin);

      expect(result).toEqual({
        id: 'task-1',
        userId: 'user-1',
        listId: 'list-1',
        originBacklogId: 'backlog-1',
        title: 'Test Task',
        description: 'Test Description',
        orderIndex: 1000,
        color: '#FF5733',
        isCompleted: false,
        createdAt: mockTask.createdAt,
        completedAt: null,
      });
    });

    it('should use default color when preloaded backlog has no color', () => {
      const backlogWithoutColor = { ...mockBacklog, color: null };
      const taskWithOrigin = { ...mockTask, originBacklog: backlogWithoutColor };

      const result = mapper.toDtoWithOrigin(taskWithOrigin);

      expect(result.color).toBe('#3B82F6');
    });

    it('should use default color when origin backlog is null', () => {
      const taskWithOrigin = { ...mockTask, originBacklog: null };

      const result = mapper.toDtoWithOrigin(taskWithOrigin);

      expect(result.color).toBe('#3B82F6');
      expect(result.originBacklogId).toBe('backlog-1');
    });

    it('should fallback to listId when originBacklogId is null', () => {
      const taskWithoutOrigin = { ...mockTask, originBacklogId: null, originBacklog: null };

      const result = mapper.toDtoWithOrigin(taskWithoutOrigin);

      expect(result.originBacklogId).toBe('list-1');
    });
  });

  describe('toDtos', () => {
    it('should return empty array for empty input', async () => {
      const result = await mapper.toDtos([]);

      expect(result).toEqual([]);
      expect(listsRepository.findManyByIds).not.toHaveBeenCalled();
    });

    it('should map single task', async () => {
      listsRepository.findManyByIds.mockResolvedValue([mockBacklog]);

      const result = await mapper.toDtos([mockTask]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'task-1',
        userId: 'user-1',
        listId: 'list-1',
        originBacklogId: 'backlog-1',
        title: 'Test Task',
        description: 'Test Description',
        orderIndex: 1000,
        color: '#FF5733',
        isCompleted: false,
        createdAt: mockTask.createdAt,
        completedAt: null,
      });
      expect(listsRepository.findManyByIds).toHaveBeenCalledWith('user-1', ['backlog-1']);
    });

    it('should batch fetch multiple origin backlogs efficiently', async () => {
      const backlog2: List = { ...mockBacklog, id: 'backlog-2', color: '#00FF00' };
      const task2: Task = { ...mockTask, id: 'task-2', originBacklogId: 'backlog-2' };

      listsRepository.findManyByIds.mockResolvedValue([mockBacklog, backlog2]);

      const result = await mapper.toDtos([mockTask, task2]);

      expect(result).toHaveLength(2);
      expect(result[0].color).toBe('#FF5733');
      expect(result[1].color).toBe('#00FF00');
      expect(listsRepository.findManyByIds).toHaveBeenCalledTimes(1);
      expect(listsRepository.findManyByIds).toHaveBeenCalledWith('user-1', [
        'backlog-1',
        'backlog-2',
      ]);
    });

    it('should handle tasks sharing same origin backlog', async () => {
      const task2: Task = { ...mockTask, id: 'task-2' };
      const task3: Task = { ...mockTask, id: 'task-3' };

      listsRepository.findManyByIds.mockResolvedValue([mockBacklog]);

      const result = await mapper.toDtos([mockTask, task2, task3]);

      expect(result).toHaveLength(3);
      expect(result[0].color).toBe('#FF5733');
      expect(result[1].color).toBe('#FF5733');
      expect(result[2].color).toBe('#FF5733');
      expect(listsRepository.findManyByIds).toHaveBeenCalledWith('user-1', ['backlog-1']);
    });

    it('should handle tasks with null originBacklogId', async () => {
      const taskWithoutOrigin = { ...mockTask, originBacklogId: null };

      listsRepository.findManyByIds.mockResolvedValue([]);

      const result = await mapper.toDtos([taskWithoutOrigin]);

      expect(result).toHaveLength(1);
      expect(result[0].originBacklogId).toBe('list-1');
      expect(result[0].color).toBe('#3B82F6');
      expect(listsRepository.findManyByIds).toHaveBeenCalledWith('user-1', []);
    });

    it('should handle missing backlogs with default color', async () => {
      listsRepository.findManyByIds.mockResolvedValue([]);

      const result = await mapper.toDtos([mockTask]);

      expect(result).toHaveLength(1);
      expect(result[0].color).toBe('#3B82F6');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle mixed completed and incomplete tasks', async () => {
      const completedTask: Task = {
        ...mockTask,
        id: 'task-2',
        completedAt: new Date('2025-01-15'),
      };

      listsRepository.findManyByIds.mockResolvedValue([mockBacklog]);

      const result = await mapper.toDtos([mockTask, completedTask]);

      expect(result).toHaveLength(2);
      expect(result[0].isCompleted).toBe(false);
      expect(result[1].isCompleted).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle task with undefined description', async () => {
      const taskWithoutDesc = { ...mockTask, description: null };
      listsRepository.findById.mockResolvedValue(mockBacklog);

      const result = await mapper.toDto(taskWithoutDesc);

      expect(result.description).toBeNull();
    });

    it('should preserve exact timestamp values', async () => {
      const specificDate = new Date('2025-03-15T10:30:00Z');
      const taskWithSpecificDate = {
        ...mockTask,
        createdAt: specificDate,
        completedAt: specificDate,
      };
      listsRepository.findById.mockResolvedValue(mockBacklog);

      const result = await mapper.toDto(taskWithSpecificDate);

      expect(result.createdAt).toEqual(specificDate);
      expect(result.completedAt).toEqual(specificDate);
    });

    it('should handle very large orderIndex values', async () => {
      const taskWithLargeIndex = { ...mockTask, orderIndex: 999999999 };
      listsRepository.findById.mockResolvedValue(mockBacklog);

      const result = await mapper.toDto(taskWithLargeIndex);

      expect(result.orderIndex).toBe(999999999);
    });
  });
});
