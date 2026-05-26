import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ListsRepository } from '../infra/lists.repository';
import { TasksRepository } from '../../tasks/infra/tasks.repository';
import { AppLogger } from '../../logger/app-logger';

const MAX_TASKS_PER_LIST = 100;

export interface MoveAllTasksResult {
  movedCount: number;
}

@Injectable()
export class MoveAllTasks {
  constructor(
    private readonly listsRepository: ListsRepository,
    private readonly tasksRepository: TasksRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MoveAllTasks.name);
  }

  async execute(
    userId: string,
    sourceListId: string,
    destinationListId: string,
  ): Promise<MoveAllTasksResult> {
    this.logger.log(
      `Moving all tasks from list ${sourceListId} to ${destinationListId} for user ${userId}`,
    );

    try {
      if (sourceListId === destinationListId) {
        throw new BadRequestException('Source and destination list must be different');
      }

      const [source, destination] = await Promise.all([
        this.listsRepository.findById(sourceListId, userId),
        this.listsRepository.findById(destinationListId, userId),
      ]);

      if (!source) {
        throw new NotFoundException(`Source list ${sourceListId} not found`);
      }
      if (!destination) {
        throw new NotFoundException(`Destination list ${destinationListId} not found`);
      }
      if (source.isDone) {
        throw new BadRequestException('Cannot move tasks out of the Done list');
      }
      if (destination.isDone) {
        throw new BadRequestException('Cannot move tasks into the Done list directly');
      }

      const [sourceCount, destCount] = await Promise.all([
        this.tasksRepository.countByList(userId, sourceListId),
        this.tasksRepository.countByList(userId, destinationListId),
      ]);

      if (sourceCount === 0) {
        return { movedCount: 0 };
      }

      if (sourceCount + destCount > MAX_TASKS_PER_LIST) {
        throw new BadRequestException(
          `Destination list cannot fit ${sourceCount} more tasks (limit ${MAX_TASKS_PER_LIST}, currently ${destCount})`,
        );
      }

      const movedCount = await this.tasksRepository.moveAllNonCompletedTasks(
        userId,
        sourceListId,
        destinationListId,
      );

      this.logger.log(`Moved ${movedCount} tasks from ${sourceListId} to ${destinationListId}`);

      return { movedCount };
    } catch (error) {
      this.logger.error(
        `Failed to move all tasks from ${sourceListId} to ${destinationListId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
