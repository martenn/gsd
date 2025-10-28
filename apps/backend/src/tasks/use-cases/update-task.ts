import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TasksRepository } from '../infra/tasks.repository';

@Injectable()
export class UpdateTask {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute(userId: string, taskId: string, dto: UpdateTaskDto): Promise<TaskDto> {
    await this.validateAtLeastOneField(dto);
    const task = await this.validateTaskOwnership(userId, taskId);
    this.validateTaskNotCompleted(task);

    const updatedTask = await this.tasksRepository.update(userId, taskId, {
      title: dto.title,
      description: dto.description,
    });

    return this.toDto(updatedTask);
  }

  private async validateAtLeastOneField(dto: UpdateTaskDto): Promise<void> {
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

  private validateTaskNotCompleted(task: any): void {
    if (task.completedAt !== null) {
      throw new BadRequestException('Cannot modify a completed task');
    }
  }

  private toDto(task: any): TaskDto {
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
