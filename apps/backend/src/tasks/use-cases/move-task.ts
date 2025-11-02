import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';
import { Task } from '@prisma/client';

@Injectable()
export class MoveTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MoveTask.name);
  }

  async execute(userId: string, taskId: string, targetListId: string): Promise<TaskDto> {
    this.logger.log(
      `Moving task ${taskId} to list ${targetListId} for user ${userId}`,
    );

    try {
      const task = await this.tasksRepository.findById(userId, taskId);
      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }

      const targetList = await this.listsRepository.findById(targetListId, userId);
      if (!targetList) {
        throw new NotFoundException(`Target list with ID ${targetListId} not found`);
      }

      if (targetList.isDone) {
        throw new BadRequestException(
          'Cannot move task to Done list. Use complete endpoint instead.',
        );
      }

      const taskCount = await this.tasksRepository.countByList(userId, targetListId);
      if (taskCount >= 100) {
        throw new BadRequestException('Target list has reached maximum capacity of 100 tasks');
      }

      const maxOrderIndex = await this.tasksRepository.findMaxOrderIndex(userId, targetListId);
      const newOrderIndex = maxOrderIndex !== null ? maxOrderIndex + 1000 : 1000;

      const updatedTask = await this.tasksRepository.moveTask(
        userId,
        taskId,
        targetListId,
        newOrderIndex,
      );

      this.logger.log(
        `Successfully moved task ${taskId} to list ${targetListId} with orderIndex ${newOrderIndex}`,
      );

      return this.toDto(updatedTask);
    } catch (error) {
      this.logger.error(
        `Failed to move task ${taskId} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private toDto(task: Task): TaskDto {
    return {
      id: task.id,
      userId: task.userId,
      listId: task.listId,
      originBacklogId: task.listId,
      title: task.title,
      description: task.description,
      orderIndex: task.orderIndex,
      color: '#3B82F6',
      isCompleted: task.completedAt !== null,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    };
  }
}
