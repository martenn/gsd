import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Task } from '@prisma/client';
import { TaskDto, GetTasksResponseDto } from '@gsd/types';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { GetTasksQueryDto } from '../dto/get-tasks-query.dto';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class GetTasks {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
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
        : [];

      const total = listId ? await this.tasksRepository.countByList(userId, listId) : 0;

      this.logger.log(`Found ${tasks.length} tasks (total: ${total}) for user ${userId}`);

      return {
        tasks: tasks.map((task) => this.toDto(task)),
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
