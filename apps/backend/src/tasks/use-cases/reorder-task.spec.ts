import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReorderTask } from './reorder-task';
import { TasksRepository } from '../infra/tasks.repository';
import { AppLogger } from '../../logger/app-logger';
import { ReorderTaskDto } from '../dto/reorder-task.dto';

describe('ReorderTask', () => {
  let reorderTask: ReorderTask;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let logger: jest.Mocked<AppLogger>;

  const userId = 'user-123';
  const taskId = 'task-789';
  const listId = 'list-456';

  beforeEach(() => {
    tasksRepository = {
      findById: jest.fn(),
      updateOrderIndex: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    reorderTask = new ReorderTask(tasksRepository, logger);
  });

  describe('execute', () => {
    const mockTask = {
      id: taskId,
      userId,
      listId,
      title: 'Test Task',
      description: 'Test Description',
      orderIndex: 1000,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('using newOrderIndex', () => {
      it('should reorder task with explicit newOrderIndex', async () => {
        const dto: ReorderTaskDto = { newOrderIndex: 2000 };
        tasksRepository.findById.mockResolvedValue(mockTask);
        tasksRepository.updateOrderIndex.mockResolvedValue({
          ...mockTask,
          orderIndex: 2000,
        });

        await reorderTask.execute(userId, taskId, dto);

        expect(tasksRepository.updateOrderIndex).toHaveBeenCalledWith(
          userId,
          taskId,
          2000,
        );
      });

      it('should accept orderIndex of 0', async () => {
        const dto: ReorderTaskDto = { newOrderIndex: 0 };
        tasksRepository.findById.mockResolvedValue(mockTask);
        tasksRepository.updateOrderIndex.mockResolvedValue({
          ...mockTask,
          orderIndex: 0,
        });

        await reorderTask.execute(userId, taskId, dto);

        expect(tasksRepository.updateOrderIndex).toHaveBeenCalledWith(
          userId,
          taskId,
          0,
        );
      });

      it('should throw BadRequestException for negative newOrderIndex', async () => {
        const dto: ReorderTaskDto = { newOrderIndex: -1 };
        tasksRepository.findById.mockResolvedValue(mockTask);

        await expect(reorderTask.execute(userId, taskId, dto)).rejects.toThrow(
          new BadRequestException('newOrderIndex must be a non-negative integer'),
        );

        expect(tasksRepository.updateOrderIndex).not.toHaveBeenCalled();
      });
    });

    describe('using afterTaskId', () => {
      const afterTaskId = 'task-reference';
      const mockAfterTask = {
        id: afterTaskId,
        userId,
        listId,
        title: 'Reference Task',
        description: null,
        orderIndex: 1500,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it('should reorder task after reference task', async () => {
        const dto: ReorderTaskDto = { afterTaskId };
        tasksRepository.findById
          .mockResolvedValueOnce(mockTask)
          .mockResolvedValueOnce(mockAfterTask);
        tasksRepository.updateOrderIndex.mockResolvedValue({
          ...mockTask,
          orderIndex: 1501,
        });

        await reorderTask.execute(userId, taskId, dto);

        expect(tasksRepository.updateOrderIndex).toHaveBeenCalledWith(
          userId,
          taskId,
          1501,
        );
      });

      it('should throw NotFoundException when reference task does not exist', async () => {
        const dto: ReorderTaskDto = { afterTaskId };
        tasksRepository.findById
          .mockResolvedValueOnce(mockTask)
          .mockResolvedValueOnce(null);

        await expect(reorderTask.execute(userId, taskId, dto)).rejects.toThrow(
          new NotFoundException(`Reference task with ID ${afterTaskId} not found`),
        );

        expect(tasksRepository.updateOrderIndex).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when reference task is in different list', async () => {
        const dto: ReorderTaskDto = { afterTaskId };
        tasksRepository.findById
          .mockResolvedValueOnce(mockTask)
          .mockResolvedValueOnce({
            ...mockAfterTask,
            listId: 'different-list',
          });

        await expect(reorderTask.execute(userId, taskId, dto)).rejects.toThrow(
          new BadRequestException(
            'Reference task must be in the same list as the task being reordered',
          ),
        );

        expect(tasksRepository.updateOrderIndex).not.toHaveBeenCalled();
      });
    });

    describe('validation', () => {
      it('should throw NotFoundException when task does not exist', async () => {
        const dto: ReorderTaskDto = { newOrderIndex: 2000 };
        tasksRepository.findById.mockResolvedValue(null);

        await expect(reorderTask.execute(userId, taskId, dto)).rejects.toThrow(
          new NotFoundException(`Task with ID ${taskId} not found`),
        );

        expect(tasksRepository.updateOrderIndex).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when neither newOrderIndex nor afterTaskId provided', async () => {
        const dto: ReorderTaskDto = {};
        tasksRepository.findById.mockResolvedValue(mockTask);

        await expect(reorderTask.execute(userId, taskId, dto)).rejects.toThrow(
          new BadRequestException('Either newOrderIndex or afterTaskId must be provided'),
        );

        expect(tasksRepository.updateOrderIndex).not.toHaveBeenCalled();
      });
    });

    describe('logging', () => {
      it('should log errors when reorder fails', async () => {
        const dto: ReorderTaskDto = { newOrderIndex: 2000 };
        const error = new Error('Database error');
        tasksRepository.findById.mockRejectedValue(error);

        await expect(reorderTask.execute(userId, taskId, dto)).rejects.toThrow(error);

        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining(`Failed to reorder task ${taskId}`),
          expect.any(String),
        );
      });
    });
  });
});
