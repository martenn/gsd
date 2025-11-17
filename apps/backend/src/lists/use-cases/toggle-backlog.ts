import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ListDto } from '@gsd/types';
import { ListsRepository } from '../infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';
import { List } from '@prisma/client';

@Injectable()
export class ToggleBacklog {
  constructor(
    private readonly repository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ToggleBacklog.name);
  }

  async execute(userId: string, listId: string): Promise<ListDto> {
    this.logger.log(`Toggling backlog status for list ${listId} for user ${userId}`);

    try {
      const list = await this.repository.findById(listId, userId);

      if (!list) {
        throw new NotFoundException('List not found');
      }

      if (list.isDone) {
        throw new BadRequestException('Cannot toggle backlog status of the Done list');
      }

      if (list.isBacklog) {
        const backlogCount = await this.repository.countBacklogs(userId);
        if (backlogCount === 1) {
          throw new BadRequestException(
            'Cannot unmark the last backlog. At least one backlog must exist.',
          );
        }
      }

      const updated = await this.repository.update(listId, userId, { isBacklog: !list.isBacklog });

      this.logger.log(
        `Successfully toggled backlog status for list ${listId} to ${!list.isBacklog}`,
      );
      return this.toDto(updated);
    } catch (error) {
      this.logger.error(
        `Failed to toggle backlog for list ${listId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private toDto(list: List): ListDto {
    return {
      id: list.id,
      name: list.name,
      orderIndex: list.orderIndex,
      isBacklog: list.isBacklog,
      isDone: list.isDone,
      color: list.color,
      userId: list.userId,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }
}
