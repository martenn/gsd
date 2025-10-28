import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../infra/tasks.repository';

@Injectable()
export class DeleteTask {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute(userId: string, taskId: string): Promise<void> {
    await this.validateTaskOwnership(userId, taskId);
    await this.tasksRepository.delete(userId, taskId);
  }

  private async validateTaskOwnership(userId: string, taskId: string): Promise<void> {
    const task = await this.tasksRepository.findById(userId, taskId);

    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    if (task.userId !== userId) {
      throw new ForbiddenException("You don't have permission to access this task");
    }
  }
}
