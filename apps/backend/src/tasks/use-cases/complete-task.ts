import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { TaskDto } from '@gsd/types';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { TaskMapper } from '../mappers/task.mapper';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class CompleteTask {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly taskMapper: TaskMapper,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CompleteTask.name);
  }

  async execute(userId: string, taskId: string): Promise<TaskDto> {
    this.logger.log(`Completing task ${taskId} for user ${userId}`);

    try {
      const task = await this.tasksRepository.findById(userId, taskId);
      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }

      const doneList = await this.listsRepository.findDoneList(userId);
      if (!doneList) {
        throw new InternalServerErrorException(
          'Done list not found. This is a data integrity issue.',
        );
      }

      const completedTask = await this.tasksRepository.completeTask(userId, taskId, doneList.id);

      this.logger.log(
        `Successfully completed task ${taskId} and moved to Done list ${doneList.id}`,
      );

      return this.taskMapper.toDto(completedTask);
    } catch (error) {
      this.logger.error(
        `Failed to complete task ${taskId} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
