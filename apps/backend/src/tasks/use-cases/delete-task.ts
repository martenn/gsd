import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../infra/tasks.repository';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class DeleteTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(DeleteTask.name);
  }

  async execute(userId: string, taskId: string): Promise<void> {
    this.logger.log(`Deleting task ${taskId} for user ${userId}`);

    try {
      await this.validateTaskOwnership(userId, taskId);
      await this.tasksRepository.delete(userId, taskId);

      this.logger.log(`Task ${taskId} deleted successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to delete task ${taskId} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
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
