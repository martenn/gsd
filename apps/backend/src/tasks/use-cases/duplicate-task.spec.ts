import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DuplicateTask } from './duplicate-task';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { TaskMapper } from '../mappers/task.mapper';
import { AppLogger } from '../../logger/app-logger';

describe('DuplicateTask', () => {
  let duplicateTask: DuplicateTask;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let listsRepository: jest.Mocked<ListsRepository>;
  let taskMapper: jest.Mocked<TaskMapper>;
  let logger: jest.Mocked<AppLogger>;

  const userId = 'user-123';
  const taskId = 'task-789';
  const listId = 'list-456';
  const originBacklogId = 'backlog-1';

  beforeEach(() => {
    tasksRepository = {
      findById: jest.fn(),
      countByList: jest.fn(),
      findNextBelow: jest.fn(),
      findMaxOrderIndex: jest.fn(),
      create: jest.fn(),
    } as any;

    listsRepository = {
      findById: jest.fn(),
    } as any;

    taskMapper = {
      toDto: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    duplicateTask = new DuplicateTask(tasksRepository, listsRepository, taskMapper, logger);
  });

  describe('execute', () => {
    const mockOriginal = {
      id: taskId,
      userId,
      listId,
      originBacklogId,
      title: 'Original Title',
      description: 'Original Description',
      orderIndex: 2000,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('throws NotFoundException when original task does not exist', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(duplicateTask.execute(userId, taskId)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when original task is completed', async () => {
      tasksRepository.findById.mockResolvedValue({ ...mockOriginal, completedAt: new Date() });

      await expect(duplicateTask.execute(userId, taskId)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when list is at task limit', async () => {
      tasksRepository.findById.mockResolvedValue(mockOriginal);
      tasksRepository.countByList.mockResolvedValue(100);

      await expect(duplicateTask.execute(userId, taskId)).rejects.toThrow(BadRequestException);
    });

    it('inserts midpoint orderIndex when there is a task below the original', async () => {
      tasksRepository.findById.mockResolvedValue(mockOriginal);
      tasksRepository.countByList.mockResolvedValue(2);
      tasksRepository.findNextBelow.mockResolvedValue(1000);
      tasksRepository.create.mockImplementation((data) =>
        Promise.resolve({
          id: 'new-task-id',
          userId,
          listId: data.listId,
          originBacklogId: data.originBacklogId,
          title: data.title,
          description: data.description ?? null,
          orderIndex: data.orderIndex,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      taskMapper.toDto.mockImplementation((t) =>
        Promise.resolve({
          id: t.id,
          userId: t.userId,
          listId: t.listId,
          originBacklogId: t.originBacklogId,
          title: t.title,
          description: t.description,
          orderIndex: t.orderIndex,
          color: '#000',
          isCompleted: false,
          createdAt: t.createdAt,
          completedAt: null,
        }),
      );

      await duplicateTask.execute(userId, taskId);

      // Midpoint between original (2000) and nextBelow (1000) = 1500.
      expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderIndex: 1500, title: 'Original Title' }),
      );
    });

    it('uses half of orderIndex when original is the last task in the list', async () => {
      tasksRepository.findById.mockResolvedValue(mockOriginal);
      tasksRepository.countByList.mockResolvedValue(1);
      tasksRepository.findNextBelow.mockResolvedValue(null);
      tasksRepository.create.mockResolvedValue({
        ...mockOriginal,
        id: 'new-task-id',
        orderIndex: 1000,
      } as any);
      taskMapper.toDto.mockResolvedValue({} as any);

      await duplicateTask.execute(userId, taskId);

      // No nextBelow → orderIndex / 2 = 1000.
      expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderIndex: 1000 }),
      );
    });

    it('preserves title, description, listId, and originBacklogId on the copy', async () => {
      tasksRepository.findById.mockResolvedValue(mockOriginal);
      tasksRepository.countByList.mockResolvedValue(1);
      tasksRepository.findNextBelow.mockResolvedValue(null);
      tasksRepository.create.mockResolvedValue({ ...mockOriginal, id: 'new-id' } as any);
      taskMapper.toDto.mockResolvedValue({} as any);

      await duplicateTask.execute(userId, taskId);

      expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Original Title',
          description: 'Original Description',
          listId,
          originBacklogId,
          userId,
        }),
      );
    });

    describe("target 'origin-backlog'", () => {
      const mockBacklog = {
        id: originBacklogId,
        userId,
        name: 'Backlog',
        orderIndex: 1000,
        isBacklog: true,
        isDone: false,
        color: '#3B82F6',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it('copies to the top of the origin backlog (max + step) and checks its capacity', async () => {
        tasksRepository.findById.mockResolvedValue(mockOriginal);
        listsRepository.findById.mockResolvedValue(mockBacklog);
        tasksRepository.countByList.mockResolvedValue(3);
        tasksRepository.findMaxOrderIndex.mockResolvedValue(5000);
        tasksRepository.create.mockImplementation((data) =>
          Promise.resolve({ ...mockOriginal, id: 'new-id', ...data } as any),
        );
        taskMapper.toDto.mockResolvedValue({} as any);

        await duplicateTask.execute(userId, taskId, 'origin-backlog');

        // ListsRepository.findById takes (id, userId) — opposite of TasksRepository.
        expect(listsRepository.findById).toHaveBeenCalledWith(originBacklogId, userId);
        // Capacity + max-orderIndex are checked against the backlog, not the source list.
        expect(tasksRepository.countByList).toHaveBeenCalledWith(userId, originBacklogId);
        expect(tasksRepository.findMaxOrderIndex).toHaveBeenCalledWith(userId, originBacklogId);
        expect(tasksRepository.findNextBelow).not.toHaveBeenCalled();
        expect(tasksRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            listId: originBacklogId,
            originBacklogId,
            orderIndex: 6000,
            title: 'Original Title',
          }),
        );
      });

      it('uses the initial order index when the origin backlog is empty', async () => {
        tasksRepository.findById.mockResolvedValue(mockOriginal);
        listsRepository.findById.mockResolvedValue(mockBacklog);
        tasksRepository.countByList.mockResolvedValue(0);
        tasksRepository.findMaxOrderIndex.mockResolvedValue(null);
        tasksRepository.create.mockResolvedValue({ ...mockOriginal, id: 'new-id' } as any);
        taskMapper.toDto.mockResolvedValue({} as any);

        await duplicateTask.execute(userId, taskId, 'origin-backlog');

        expect(tasksRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ orderIndex: 1000 }),
        );
      });

      it('throws NotFoundException when the origin backlog no longer exists', async () => {
        tasksRepository.findById.mockResolvedValue(mockOriginal);
        listsRepository.findById.mockResolvedValue(null);

        await expect(duplicateTask.execute(userId, taskId, 'origin-backlog')).rejects.toThrow(
          NotFoundException,
        );

        expect(tasksRepository.create).not.toHaveBeenCalled();
      });

      it('throws BadRequestException when the origin backlog is at capacity', async () => {
        tasksRepository.findById.mockResolvedValue(mockOriginal);
        listsRepository.findById.mockResolvedValue(mockBacklog);
        tasksRepository.countByList.mockResolvedValue(100);

        await expect(duplicateTask.execute(userId, taskId, 'origin-backlog')).rejects.toThrow(
          BadRequestException,
        );

        expect(tasksRepository.create).not.toHaveBeenCalled();
      });
    });
  });
});
