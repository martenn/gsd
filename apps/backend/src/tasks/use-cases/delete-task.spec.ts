import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteTask } from './delete-task';
import { TasksRepository } from '../infra/tasks.repository';
import { AppLogger } from '../../logger/app-logger';

describe('DeleteTask', () => {
  let deleteTask: DeleteTask;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let logger: jest.Mocked<AppLogger>;

  const userId = 'user-123';
  const taskId = 'task-789';

  beforeEach(() => {
    tasksRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    deleteTask = new DeleteTask(tasksRepository, logger);
  });

  describe('execute', () => {
    const mockTask = {
      id: taskId,
      userId,
      listId: 'list-456',
      title: 'Test Task',
      description: 'Test Description',
      orderIndex: 1000,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should delete task successfully', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      tasksRepository.delete.mockResolvedValue(undefined);

      await deleteTask.execute(userId, taskId);

      expect(tasksRepository.findById).toHaveBeenCalledWith(userId, taskId);
      expect(tasksRepository.delete).toHaveBeenCalledWith(userId, taskId);
    });

    it('should delete completed task', async () => {
      tasksRepository.findById.mockResolvedValue({
        ...mockTask,
        completedAt: new Date(),
      });
      tasksRepository.delete.mockResolvedValue(undefined);

      await deleteTask.execute(userId, taskId);

      expect(tasksRepository.delete).toHaveBeenCalledWith(userId, taskId);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(deleteTask.execute(userId, taskId)).rejects.toThrow(
        new NotFoundException(`Task with id ${taskId} not found`),
      );

      expect(tasksRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own task', async () => {
      tasksRepository.findById.mockResolvedValue({
        ...mockTask,
        userId: 'different-user',
      });

      await expect(deleteTask.execute(userId, taskId)).rejects.toThrow(
        new ForbiddenException("You don't have permission to access this task"),
      );

      expect(tasksRepository.delete).not.toHaveBeenCalled();
    });
  });
});
