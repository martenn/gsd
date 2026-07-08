import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { TaskMapper } from '../mappers/task.mapper';
import { OrderIndexHelper } from '../infra/order-index.helper';
import { AppLogger } from '../../logger/app-logger';

const MAX_TASKS_PER_LIST = 100;

@Injectable()
export class DuplicateTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly taskMapper: TaskMapper,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(DuplicateTask.name);
  }

  async execute(userId: string, taskId: string, targetListId?: string): Promise<TaskDto> {
    this.logger.log(
      `Duplicating task ${taskId} for user ${userId}` +
        (targetListId ? ` into list ${targetListId}` : ' in place'),
    );

    try {
      const original = await this.tasksRepository.findById(userId, taskId);
      if (!original) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }

      if (original.completedAt !== null) {
        throw new BadRequestException('Cannot duplicate a completed task');
      }

      // No target list → duplicate in place, just below the original in its
      // current list. Target list → insert the copy at the top of that list.
      let destListId: string;
      let newOrderIndex: number;

      if (targetListId) {
        const targetList = await this.listsRepository.findById(targetListId, userId);
        if (!targetList) {
          throw new NotFoundException(`Target list with ID ${targetListId} not found`);
        }
        if (targetList.isDone) {
          throw new BadRequestException('Cannot duplicate a task into the Done list');
        }
        await this.assertListHasCapacity(userId, targetListId);
        destListId = targetListId;
        newOrderIndex = await this.calculateInsertAtTop(userId, targetListId);
      } else {
        await this.assertListHasCapacity(userId, original.listId);
        destListId = original.listId;
        newOrderIndex = await this.calculateInsertBelow(
          userId,
          original.listId,
          original.orderIndex,
        );
      }

      const duplicate = await this.tasksRepository.create({
        title: original.title,
        description: original.description,
        listId: destListId,
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

  private async assertListHasCapacity(userId: string, listId: string): Promise<void> {
    const taskCount = await this.tasksRepository.countByList(userId, listId);
    if (taskCount >= MAX_TASKS_PER_LIST) {
      throw new BadRequestException(`List has reached maximum task limit (${MAX_TASKS_PER_LIST})`);
    }
  }

  // Tasks render in descending orderIndex (top = highest), so the top slot is the
  // current max plus a step (mirrors how new tasks are inserted).
  private async calculateInsertAtTop(userId: string, listId: string): Promise<number> {
    const maxOrderIndex = await this.tasksRepository.findMaxOrderIndex(userId, listId);
    return OrderIndexHelper.calculateTopPosition(maxOrderIndex);
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
