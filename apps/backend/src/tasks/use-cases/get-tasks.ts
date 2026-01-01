import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetTasksResponseDto } from '@gsd/types';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { GetTasksQueryDto } from '../dto/get-tasks-query.dto';
import { TaskMapper } from '../mappers/task.mapper';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class GetTasks {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly taskMapper: TaskMapper,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetTasks.name);
  }

  async execute(userId: string, query: GetTasksQueryDto): Promise<GetTasksResponseDto> {
    const { listId, includeCompleted = false, limit = 100, offset = 0 } = query;

    this.logger.log(
      `Fetching tasks for user ${userId}, list: ${listId || 'all'}, includeCompleted: ${includeCompleted}`,
    );

    try {
      if (listId) {
        await this.validateList(userId, listId);
      }

      const tasks = listId
        ? await this.tasksRepository.findManyByList(userId, listId, {
            limit,
            offset,
            includeCompleted,
          })
        : await this.tasksRepository.findManyByUser(userId, {
            limit,
            offset,
            includeCompleted,
          });

      const total = listId
        ? await this.tasksRepository.countByList(userId, listId)
        : await this.tasksRepository.countByUser(userId);

      this.logger.log(`Found ${tasks.length} tasks (total: ${total}) for user ${userId}`);

      const taskDtos = await this.taskMapper.toDtos(tasks);

      return {
        tasks: taskDtos,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch tasks for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async validateList(userId: string, listId: string): Promise<void> {
    const list = await this.listsRepository.findById(listId, userId);

    if (!list) {
      throw new NotFoundException(`List with id ${listId} not found`);
    }

    if (list.userId !== userId) {
      throw new ForbiddenException("You don't have permission to access this list");
    }
  }
}
