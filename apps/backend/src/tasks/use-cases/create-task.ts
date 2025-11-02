import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { OrderIndexHelper } from '../infra/order-index.helper';
import { Task } from '@prisma/client';
import { AppLogger } from '../../logger/app-logger';

const MAX_TASKS_PER_LIST = 100;

@Injectable()
export class CreateTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CreateTask.name);
  }

  async execute(userId: string, dto: CreateTaskDto): Promise<TaskDto> {
    this.logger.log(`Creating task for user ${userId} in list ${dto.listId}: ${dto.title}`);

    try {
      await this.validateList(userId, dto.listId);
      await this.validateTaskCapacity(userId, dto.listId);

      const orderIndex = await this.calculateOrderIndex(userId, dto.listId);

      const task = await this.tasksRepository.create({
        title: dto.title,
        description: dto.description ?? null,
        listId: dto.listId,
        userId,
        orderIndex,
      });

      this.logger.log(`Task created successfully: ${task.id}`);

      return this.toDto(task);
    } catch (error) {
      this.logger.error(
        `Failed to create task for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

    if (list.isDone) {
      throw new BadRequestException('Cannot create tasks in Done list directly');
    }
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
