import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { OrderIndexHelper } from '../infra/order-index.helper';
import { TaskMapper } from '../mappers/task.mapper';
import { List } from '@prisma/client';
import { AppLogger } from '../../logger/app-logger';

const MAX_TASKS_PER_LIST = 100;

@Injectable()
export class CreateTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly taskMapper: TaskMapper,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CreateTask.name);
  }

  async execute(userId: string, dto: CreateTaskDto): Promise<TaskDto> {
    this.logger.log(`Creating task for user ${userId} in list ${dto.listId}: ${dto.title}`);

    try {
      const list = await this.validateList(userId, dto.listId);
      await this.validateTaskCapacity(userId, dto.listId);

      const originBacklogId = await this.resolveOriginBacklog(userId, list);
      const orderIndex = await this.calculateOrderIndex(userId, dto.listId);

      const task = await this.tasksRepository.create({
        title: dto.title,
        description: dto.description ?? null,
        listId: dto.listId,
        originBacklogId,
        userId,
        orderIndex,
      });

      this.logger.log(`Task created successfully: ${task.id} with origin backlog ${originBacklogId}`);

      return this.taskMapper.toDto(task);
    } catch (error) {
      this.logger.error(
        `Failed to create task for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async validateList(userId: string, listId: string): Promise<List> {
    const list = await this.listsRepository.findById(listId, userId);

    if (!list) {
      throw new NotFoundException(`List with id ${listId} not found`);
    }

    if (list.userId !== userId) {
      throw new ForbiddenException("You don't have permission to access this list");
    }

    if (list.isDone) {
      throw new BadRequestException('Cannot create tasks in Done list directly');
    }

    return list;
  }

  private async validateTaskCapacity(userId: string, listId: string): Promise<void> {
    const currentTaskCount = await this.tasksRepository.countByList(userId, listId);

    if (currentTaskCount >= MAX_TASKS_PER_LIST) {
      throw new BadRequestException(`List has reached maximum task limit (${MAX_TASKS_PER_LIST})`);
    }
  }

  private async calculateOrderIndex(userId: string, listId: string): Promise<number> {
    const maxOrderIndex = await this.tasksRepository.findMaxOrderIndex(userId, listId);
    return OrderIndexHelper.calculateTopPosition(maxOrderIndex);
  }

  private async resolveOriginBacklog(userId: string, targetList: List): Promise<string> {
    if (targetList.isBacklog) {
      return targetList.id;
    }

    const backlogs = await this.listsRepository.findBacklogs(userId);
    if (backlogs.length === 0) {
      throw new InternalServerErrorException('No backlog found for user. This is a data integrity issue.');
    }

    const defaultBacklog = backlogs[0];
    this.logger.log(
      `Task created in intermediate list ${targetList.id}, using topmost backlog ${defaultBacklog.id}`,
    );
    return defaultBacklog.id;
  }
}
