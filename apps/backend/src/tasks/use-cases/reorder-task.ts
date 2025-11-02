import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksRepository } from '../infra/tasks.repository';
import { AppLogger } from '../../logger/app-logger';
import { ReorderTaskDto } from '../dto/reorder-task.dto';

@Injectable()
export class ReorderTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ReorderTask.name);
  }

  async execute(userId: string, taskId: string, dto: ReorderTaskDto): Promise<void> {
    this.logger.log(`Reordering task ${taskId} for user ${userId}`);

    try {
      const task = await this.tasksRepository.findById(userId, taskId);
      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }

      let newOrderIndex: number;

      if (dto.newOrderIndex !== undefined) {
        if (dto.newOrderIndex < 0) {
          throw new BadRequestException('newOrderIndex must be a non-negative integer');
        }
        newOrderIndex = dto.newOrderIndex;
        this.logger.log(`Using explicit newOrderIndex: ${newOrderIndex}`);
      } else if (dto.afterTaskId !== undefined) {
        const afterTask = await this.tasksRepository.findById(userId, dto.afterTaskId);
        if (!afterTask) {
          throw new NotFoundException(`Reference task with ID ${dto.afterTaskId} not found`);
        }

        if (afterTask.listId !== task.listId) {
          throw new BadRequestException(
            'Reference task must be in the same list as the task being reordered',
          );
        }

        newOrderIndex = afterTask.orderIndex + 1;
        this.logger.log(
          `Using afterTaskId strategy: placing after task ${dto.afterTaskId} with orderIndex ${newOrderIndex}`,
        );
      } else {
        throw new BadRequestException(
          'Either newOrderIndex or afterTaskId must be provided',
        );
      }

      await this.tasksRepository.updateOrderIndex(userId, taskId, newOrderIndex);

      this.logger.log(
        `Successfully reordered task ${taskId} to orderIndex ${newOrderIndex}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to reorder task ${taskId} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
