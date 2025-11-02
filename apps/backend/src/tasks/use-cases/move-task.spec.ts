import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MoveTask } from './move-task';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

describe('MoveTask', () => {
  let moveTask: MoveTask;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let listsRepository: jest.Mocked<ListsRepository>;
  let logger: jest.Mocked<AppLogger>;

  const userId = 'user-123';
  const taskId = 'task-789';
  const targetListId = 'list-456';

  beforeEach(() => {
    tasksRepository = {
      findById: jest.fn(),
      countByList: jest.fn(),
      findMaxOrderIndex: jest.fn(),
      moveTask: jest.fn(),
    } as any;

    listsRepository = {
      findById: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    moveTask = new MoveTask(tasksRepository, listsRepository, logger);
  });

  describe('execute', () => {
    const mockTask = {
      id: taskId,
      userId,
      listId: 'list-original',
      title: 'Test Task',
      description: 'Test Description',
      orderIndex: 1000,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTargetList = {
      id: targetListId,
      userId,
      name: 'Target List',
      orderIndex: 2,
      isBacklog: false,
      isDone: false,
      color: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should move task to target list successfully', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      listsRepository.findById.mockResolvedValue(mockTargetList);
      tasksRepository.countByList.mockResolvedValue(50);
      tasksRepository.findMaxOrderIndex.mockResolvedValue(2000);
      tasksRepository.moveTask.mockResolvedValue({
        ...mockTask,
        listId: targetListId,
        orderIndex: 3000,
      });

      const result = await moveTask.execute(userId, taskId, targetListId);

      expect(result.listId).toBe(targetListId);
      expect(result.orderIndex).toBe(3000);
      expect(tasksRepository.moveTask).toHaveBeenCalledWith(
        userId,
        taskId,
        targetListId,
        3000,
      );
    });

    it('should insert at orderIndex 1000 when target list is empty', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      listsRepository.findById.mockResolvedValue(mockTargetList);
      tasksRepository.countByList.mockResolvedValue(0);
      tasksRepository.findMaxOrderIndex.mockResolvedValue(null);
      tasksRepository.moveTask.mockResolvedValue({
        ...mockTask,
        listId: targetListId,
        orderIndex: 1000,
      });

      const result = await moveTask.execute(userId, taskId, targetListId);

      expect(result.orderIndex).toBe(1000);
      expect(tasksRepository.moveTask).toHaveBeenCalledWith(
        userId,
        taskId,
        targetListId,
        1000,
      );
    });

    it('should throw NotFoundException when task does not exist', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(moveTask.execute(userId, taskId, targetListId)).rejects.toThrow(
        new NotFoundException(`Task with ID ${taskId} not found`),
      );

      expect(listsRepository.findById).not.toHaveBeenCalled();
      expect(tasksRepository.moveTask).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when target list does not exist', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      listsRepository.findById.mockResolvedValue(null);

      await expect(moveTask.execute(userId, taskId, targetListId)).rejects.toThrow(
        new NotFoundException(`Target list with ID ${targetListId} not found`),
      );

      expect(tasksRepository.moveTask).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when target list is Done', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      listsRepository.findById.mockResolvedValue({
        ...mockTargetList,
        isDone: true,
      });

      await expect(moveTask.execute(userId, taskId, targetListId)).rejects.toThrow(
        new BadRequestException('Cannot move task to Done list. Use complete endpoint instead.'),
      );

      expect(tasksRepository.moveTask).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when target list is at capacity', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      listsRepository.findById.mockResolvedValue(mockTargetList);
      tasksRepository.countByList.mockResolvedValue(100);

      await expect(moveTask.execute(userId, taskId, targetListId)).rejects.toThrow(
        new BadRequestException('Target list has reached maximum capacity of 100 tasks'),
      );

      expect(tasksRepository.moveTask).not.toHaveBeenCalled();
    });
  });
});
