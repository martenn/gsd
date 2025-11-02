import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateTask } from './update-task';
import { TasksRepository } from '../infra/tasks.repository';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { AppLogger } from '../../logger/app-logger';

describe('UpdateTask', () => {
  let updateTask: UpdateTask;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let logger: jest.Mocked<AppLogger>;

  const userId = 'user-123';
  const taskId = 'task-789';

  beforeEach(() => {
    tasksRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    updateTask = new UpdateTask(tasksRepository, logger);
  });

  describe('execute', () => {
    const mockTask = {
      id: taskId,
      userId,
      listId: 'list-456',
      title: 'Original Title',
      description: 'Original Description',
      orderIndex: 1000,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update task title successfully', async () => {
      const dto: UpdateTaskDto = { title: 'Updated Title' };

      tasksRepository.findById.mockResolvedValue(mockTask);
      tasksRepository.update.mockResolvedValue({
        ...mockTask,
        title: 'Updated Title',
      });

      const result = await updateTask.execute(userId, taskId, dto);

      expect(result.title).toBe('Updated Title');
      expect(tasksRepository.update).toHaveBeenCalledWith(userId, taskId, {
        title: 'Updated Title',
        description: undefined,
      });
    });

    it('should update task description successfully', async () => {
      const dto: UpdateTaskDto = { description: 'Updated Description' };

      tasksRepository.findById.mockResolvedValue(mockTask);
      tasksRepository.update.mockResolvedValue({
        ...mockTask,
        description: 'Updated Description',
      });

      const result = await updateTask.execute(userId, taskId, dto);

      expect(result.description).toBe('Updated Description');
      expect(tasksRepository.update).toHaveBeenCalledWith(userId, taskId, {
        title: undefined,
        description: 'Updated Description',
      });
    });

    it('should update both title and description', async () => {
      const dto: UpdateTaskDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      tasksRepository.findById.mockResolvedValue(mockTask);
      tasksRepository.update.mockResolvedValue({
        ...mockTask,
        title: 'Updated Title',
        description: 'Updated Description',
      });

      const result = await updateTask.execute(userId, taskId, dto);

      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated Description');
    });

    it('should clear description when set to null', async () => {
      const dto: UpdateTaskDto = { description: null };

      tasksRepository.findById.mockResolvedValue(mockTask);
      tasksRepository.update.mockResolvedValue({
        ...mockTask,
        description: null,
      });

      const result = await updateTask.execute(userId, taskId, dto);

      expect(result.description).toBeNull();
      expect(tasksRepository.update).toHaveBeenCalledWith(userId, taskId, {
        title: undefined,
        description: null,
      });
    });

    it('should throw BadRequestException when no fields provided', async () => {
      const dto: UpdateTaskDto = {};

      await expect(updateTask.execute(userId, taskId, dto)).rejects.toThrow(
        new BadRequestException('At least one field (title or description) must be provided'),
      );

      expect(tasksRepository.findById).not.toHaveBeenCalled();
      expect(tasksRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when task does not exist', async () => {
      const dto: UpdateTaskDto = { title: 'Updated Title' };

      tasksRepository.findById.mockResolvedValue(null);

      await expect(updateTask.execute(userId, taskId, dto)).rejects.toThrow(
        new NotFoundException(`Task with id ${taskId} not found`),
      );

      expect(tasksRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own task', async () => {
      const dto: UpdateTaskDto = { title: 'Updated Title' };

      tasksRepository.findById.mockResolvedValue({
        ...mockTask,
        userId: 'different-user',
      });

      await expect(updateTask.execute(userId, taskId, dto)).rejects.toThrow(
        new ForbiddenException("You don't have permission to access this task"),
      );

      expect(tasksRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when task is completed', async () => {
      const dto: UpdateTaskDto = { title: 'Updated Title' };

      tasksRepository.findById.mockResolvedValue({
        ...mockTask,
        completedAt: new Date(),
      });

      await expect(updateTask.execute(userId, taskId, dto)).rejects.toThrow(
        new BadRequestException('Cannot modify a completed task'),
      );

      expect(tasksRepository.update).not.toHaveBeenCalled();
    });
  });
});
