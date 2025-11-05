import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CompleteTask } from './complete-task';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

describe('CompleteTask', () => {
  let completeTask: CompleteTask;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let listsRepository: jest.Mocked<ListsRepository>;
  let logger: jest.Mocked<AppLogger>;

  const userId = 'user-123';
  const taskId = 'task-789';
  const doneListId = 'list-done';

  beforeEach(() => {
    tasksRepository = {
      findById: jest.fn(),
      completeTask: jest.fn(),
    } as any;

    listsRepository = {
      findDoneList: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    completeTask = new CompleteTask(tasksRepository, listsRepository, logger);
  });

  describe('execute', () => {
    const mockTask = {
      id: taskId,
      userId,
      listId: 'list-today',
      title: 'Test Task',
      description: 'Test Description',
      orderIndex: 1000,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDoneList = {
      id: doneListId,
      userId,
      name: 'Done',
      orderIndex: 999,
      isBacklog: false,
      isDone: true,
      color: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should complete task successfully and return TaskDto', async () => {
      const completedAt = new Date();
      const completedTask = {
        ...mockTask,
        completedAt,
        listId: doneListId,
        orderIndex: 2000,
      };

      tasksRepository.findById.mockResolvedValue(mockTask);
      listsRepository.findDoneList.mockResolvedValue(mockDoneList);
      tasksRepository.completeTask.mockResolvedValue(completedTask);

      const result = await completeTask.execute(userId, taskId);

      expect(result).toMatchObject({
        id: taskId,
        userId,
        listId: doneListId,
        title: 'Test Task',
        description: 'Test Description',
        orderIndex: 2000,
        isCompleted: true,
      });
      expect(result.completedAt).toEqual(completedAt);

      expect(tasksRepository.completeTask).toHaveBeenCalledWith(userId, taskId, doneListId);
      expect(logger.log).toHaveBeenCalledWith(`Completing task ${taskId} for user ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(
        `Successfully completed task ${taskId} and moved to Done list ${doneListId}`,
      );
    });

    it('should throw NotFoundException when task does not exist', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(completeTask.execute(userId, taskId)).rejects.toThrow(
        new NotFoundException(`Task with ID ${taskId} not found`),
      );

      expect(listsRepository.findDoneList).not.toHaveBeenCalled();
      expect(tasksRepository.completeTask).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when Done list does not exist', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      listsRepository.findDoneList.mockResolvedValue(null);

      await expect(completeTask.execute(userId, taskId)).rejects.toThrow(
        new InternalServerErrorException('Done list not found. This is a data integrity issue.'),
      );

      expect(tasksRepository.completeTask).not.toHaveBeenCalled();
    });

    it('should log errors when completion fails', async () => {
      const error = new Error('Database error');
      tasksRepository.findById.mockRejectedValue(error);

      await expect(completeTask.execute(userId, taskId)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to complete task ${taskId}`),
        expect.any(String),
      );
    });
  });
});
