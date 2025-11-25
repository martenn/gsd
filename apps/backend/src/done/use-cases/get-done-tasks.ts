import { Injectable } from '@nestjs/common';
import { DoneTaskDto, GetDoneResponseDto, GetDoneQuery } from '@gsd/types';
import { DoneRepository, CompletedTaskWithList } from '../infra/done.repository';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class GetDoneTasks {
  constructor(
    private readonly repository: DoneRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetDoneTasks.name);
  }

  async execute(userId: string, query: GetDoneQuery): Promise<GetDoneResponseDto> {
    const { limit = 50, offset = 0 } = query;

    this.logger.log(
      `Fetching completed tasks for user ${userId}, limit: ${limit}, offset: ${offset}`,
    );

    try {
      const [tasks, total] = await Promise.all([
        this.repository.findCompletedTasks(userId, limit, offset),
        this.repository.countCompletedTasks(userId),
      ]);

      this.logger.log(`Found ${tasks.length} completed tasks (total: ${total}) for user ${userId}`);

      return {
        tasks: tasks.map((task) => this.toDto(task)),
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch completed tasks for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private toDto(task: CompletedTaskWithList): DoneTaskDto {
    const color = task.originBacklog.color || '#3B82F6';

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      completedAt: task.completedAt!,
      listId: task.listId,
      listName: task.list.name,
      color,
      originBacklogId: task.originBacklogId,
    };
  }
}
