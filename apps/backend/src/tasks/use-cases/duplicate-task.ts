import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { TasksRepository } from '../infra/tasks.repository';
import { TaskMapper } from '../mappers/task.mapper';
import { AppLogger } from '../../logger/app-logger';

const MAX_TASKS_PER_LIST = 100;

@Injectable()
export class DuplicateTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly taskMapper: TaskMapper,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(DuplicateTask.name);
  }

  async execute(userId: string, taskId: string): Promise<TaskDto> {
    this.logger.log(`Duplicating task ${taskId} for user ${userId}`);

    try {
      const original = await this.tasksRepository.findById(userId, taskId);
      if (!original) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }

      if (original.completedAt !== null) {
        throw new BadRequestException('Cannot duplicate a completed task');
      }

      const taskCount = await this.tasksRepository.countByList(userId, original.listId);
      if (taskCount >= MAX_TASKS_PER_LIST) {
        throw new BadRequestException(
          `List has reached maximum task limit (${MAX_TASKS_PER_LIST})`,
        );
      }

      const newOrderIndex = await this.calculateInsertBelow(
        userId,
        original.listId,
        original.orderIndex,
      );

      const duplicate = await this.tasksRepository.create({
        title: original.title,
        description: original.description,
        listId: original.listId,
        originBacklogId: original.originBacklogId,
        userId,
        orderIndex: newOrderIndex,
      });

      this.logger.log(`Task ${taskId} duplicated as ${duplicate.id}`);

      return this.taskMapper.toDto(duplicate);
    } catch (error) {
      this.logger.error(
        `Failed to duplicate task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Tasks render in descending orderIndex (top = highest). "Below" the original
  // means the next lower orderIndex slot. Midpoint with the next sibling; if the
  // original is already last, use half of its orderIndex.
  private async calculateInsertBelow(
    userId: string,
    listId: string,
    originalOrderIndex: number,
  ): Promise<number> {
    const nextBelow = await this.tasksRepository.findNextBelow(userId, listId, originalOrderIndex);
    if (nextBelow === null) {
      return originalOrderIndex / 2;
    }
    return (originalOrderIndex + nextBelow) / 2;
  }
}
