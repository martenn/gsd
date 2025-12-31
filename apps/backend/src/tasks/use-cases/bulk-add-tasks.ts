import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BulkAddTasksResponseDto, TaskDto } from '@gsd/types';
import { BulkAddTasksDto } from '../dto/bulk-add-tasks.dto';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { OrderIndexHelper } from '../infra/order-index.helper';
import { TaskMapper } from '../mappers/task.mapper';
import { List } from '@prisma/client';
import { AppLogger } from '../../logger/app-logger';

const MAX_TASKS_PER_LIST = 100;
const MAX_BULK_TASKS = 10;

@Injectable()
export class BulkAddTasks {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly taskMapper: TaskMapper,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(BulkAddTasks.name);
  }

  async execute(userId: string, dto: BulkAddTasksDto): Promise<BulkAddTasksResponseDto> {
    this.logger.log(
      `Bulk adding ${dto.tasks.length} tasks for user ${userId} to list ${dto.listId || 'default backlog'}`,
    );

    try {
      const targetListId = await this.resolveTargetList(userId, dto.listId);
      const list = await this.validateList(userId, targetListId);
      await this.validateBulkCapacity(userId, targetListId, dto.tasks.length);

      const originBacklogId = await this.resolveOriginBacklog(userId, list);
      const createdTaskEntities = [];
      let failed = 0;

      let currentOrderIndex = await this.tasksRepository.findMaxOrderIndex(userId, targetListId);

      for (const taskData of dto.tasks) {
        try {
          currentOrderIndex = OrderIndexHelper.calculateTopPosition(currentOrderIndex);

          const task = await this.tasksRepository.create({
            title: taskData.title,
            description: taskData.description ?? null,
            listId: targetListId,
            originBacklogId,
            userId,
            orderIndex: currentOrderIndex,
          });

          createdTaskEntities.push(task);
        } catch (error) {
          this.logger.error(
            `Failed to create task "${taskData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            error instanceof Error ? error.stack : undefined,
          );
          failed++;
        }
      }

      const createdTasks = await this.taskMapper.toDtos(createdTaskEntities);
      const created = createdTasks.length;
      this.logger.log(
        `Bulk add completed: ${created} tasks created, ${failed} failed for user ${userId}`,
      );

      return {
        tasks: createdTasks,
        created,
        failed,
        message:
          failed > 0
            ? `${created} tasks created, ${failed} failed`
            : `${created} tasks created successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Bulk add failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async resolveTargetList(userId: string, listId?: string): Promise<string> {
    if (listId) {
      return listId;
    }

    const backlogs = await this.listsRepository.findBacklogs(userId);
    if (backlogs.length === 0) {
      throw new InternalServerErrorException(
        'No backlog found for user. This is a data integrity issue.',
      );
    }

    const defaultBacklog = backlogs[0];
    this.logger.log(`No listId provided, using default backlog ${defaultBacklog.id}`);
    return defaultBacklog.id;
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

  private async validateBulkCapacity(
    userId: string,
    listId: string,
    tasksToAdd: number,
  ): Promise<void> {
    if (tasksToAdd > MAX_BULK_TASKS) {
      throw new BadRequestException(`Cannot add more than ${MAX_BULK_TASKS} tasks at once`);
    }

    const currentTaskCount = await this.tasksRepository.countByList(userId, listId);
    const newTotal = currentTaskCount + tasksToAdd;

    if (newTotal > MAX_TASKS_PER_LIST) {
      throw new BadRequestException(
        `Adding ${tasksToAdd} tasks would exceed maximum task limit (${MAX_TASKS_PER_LIST}). Current: ${currentTaskCount}, Limit: ${MAX_TASKS_PER_LIST}`,
      );
    }
  }

  private async resolveOriginBacklog(userId: string, targetList: List): Promise<string> {
    if (targetList.isBacklog) {
      return targetList.id;
    }

    const backlogs = await this.listsRepository.findBacklogs(userId);
    if (backlogs.length === 0) {
      throw new InternalServerErrorException(
        'No backlog found for user. This is a data integrity issue.',
      );
    }

    const defaultBacklog = backlogs[0];
    this.logger.log(
      `Tasks created in intermediate list ${targetList.id}, using topmost backlog ${defaultBacklog.id}`,
    );
    return defaultBacklog.id;
  }
}
