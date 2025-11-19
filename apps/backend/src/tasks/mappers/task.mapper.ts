import { Injectable } from '@nestjs/common';
import { Task, List } from '@prisma/client';
import { TaskDto } from '@gsd/types';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

export type TaskWithOrigin = Task & {
  originBacklog?: List | null;
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
    const originBacklog = task.originBacklogId
      ? await this.listsRepository.findById(task.userId, task.originBacklogId)
      : null;

    return this.toDtoWithOrigin({ ...task, originBacklog });
  }

  toDtoWithOrigin(task: TaskWithOrigin): TaskDto {
    const color = this.getTaskColor(task.originBacklog);
    const originBacklogId = task.originBacklogId || task.listId;

    return {
      id: task.id,
      userId: task.userId,
      listId: task.listId,
      originBacklogId,
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
    const backlogIds = [
      ...new Set(tasks.map((t) => t.originBacklogId).filter((id): id is string => !!id)),
    ];

    const backlogs = await this.listsRepository.findManyByIds(userId, backlogIds);
    const backlogMap = new Map(backlogs.map((b) => [b.id, b]));

    return tasks.map((task) => {
      const originBacklog = task.originBacklogId ? backlogMap.get(task.originBacklogId) : null;
      return this.toDtoWithOrigin({ ...task, originBacklog });
    });
  }

  private getTaskColor(originBacklog: List | null | undefined): string {
    if (originBacklog?.color) {
      return originBacklog.color;
    }

    this.logger.warn(`No origin backlog color found, using default: ${TaskMapper.DEFAULT_COLOR}`);
    return TaskMapper.DEFAULT_COLOR;
  }
}
