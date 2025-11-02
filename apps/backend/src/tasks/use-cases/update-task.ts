import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TasksRepository } from '../infra/tasks.repository';
import { Task } from '@prisma/client';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class UpdateTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UpdateTask.name);
  }

  async execute(userId: string, taskId: string, dto: UpdateTaskDto): Promise<TaskDto> {
    this.logger.log(`Updating task ${taskId} for user ${userId}`);

    try {
      this.validateAtLeastOneField(dto);
      const task = await this.validateTaskOwnership(userId, taskId);
      this.validateTaskNotCompleted(task);

      const updatedTask = await this.tasksRepository.update(userId, taskId, {
        title: dto.title,
        description: dto.description,
      });

      this.logger.log(`Task ${taskId} updated successfully`);

      return this.toDto(updatedTask);
    } catch (error) {
      this.logger.error(
        `Failed to update task ${taskId} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private validateAtLeastOneField(dto: UpdateTaskDto): void {
    if (dto.title === undefined && dto.description === undefined) {
      throw new BadRequestException('At least one field (title or description) must be provided');
    }
  }

  private async validateTaskOwnership(userId: string, taskId: string) {
    const task = await this.tasksRepository.findById(userId, taskId);

    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    if (task.userId !== userId) {
      throw new ForbiddenException("You don't have permission to access this task");
    }

    return task;
  }

  private validateTaskNotCompleted(task: Task): void {
    if (task.completedAt !== null) {
      throw new BadRequestException('Cannot modify a completed task');
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
