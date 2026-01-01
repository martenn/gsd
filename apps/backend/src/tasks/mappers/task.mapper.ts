import { Injectable } from '@nestjs/common';
import { Task, List } from '@prisma/client';
import { TaskDto } from '@gsd/types';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

export type TaskWithOrigin = Task & {
  originBacklog: List;
};

@Injectable()
export class TaskMapper {
  private static readonly DEFAULT_COLOR = '#3B82F6';

  constructor(
    private readonly listsRepository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TaskMapper.name);
  }

  async toDto(task: Task): Promise<TaskDto> {
    const originBacklog = await this.listsRepository.findById(task.originBacklogId, task.userId);

    if (!originBacklog) {
      throw new Error(`Origin backlog ${task.originBacklogId} not found for task ${task.id}`);
    }

    return this.toDtoWithOrigin({ ...task, originBacklog });
  }

  toDtoWithOrigin(task: TaskWithOrigin): TaskDto {
    const color = this.getTaskColor(task.originBacklog);

    return {
      id: task.id,
      userId: task.userId,
      listId: task.listId,
      originBacklogId: task.originBacklog.id,
      title: task.title,
      description: task.description,
      orderIndex: task.orderIndex,
      color,
      isCompleted: task.completedAt !== null,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    };
  }

  async toDtos(tasks: Task[]): Promise<TaskDto[]> {
    if (tasks.length === 0) return [];

    const userId = tasks[0].userId;
    const backlogIds = [...new Set(tasks.map((t) => t.originBacklogId))];

    const backlogs = await this.listsRepository.findManyByIds(userId, backlogIds);
    const backlogMap = new Map(backlogs.map((b) => [b.id, b]));

    return tasks.map((task) => {
      const originBacklog = backlogMap.get(task.originBacklogId);

      if (!originBacklog) {
        throw new Error(`Origin backlog ${task.originBacklogId} not found for task ${task.id}`);
      }

      return this.toDtoWithOrigin({ ...task, originBacklog });
    });
  }

  private getTaskColor(originBacklog: List): string {
    if (originBacklog.color) {
      return originBacklog.color;
    }

    this.logger.warn(
      `Origin backlog ${originBacklog.id} has no color, using default: ${TaskMapper.DEFAULT_COLOR}`,
    );
    return TaskMapper.DEFAULT_COLOR;
  }
}
