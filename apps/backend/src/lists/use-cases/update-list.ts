import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ListDto } from '@gsd/types';
import { UpdateListDto } from '../dto/update-list.dto';
import { ListsRepository } from '../infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';
import { List } from '@prisma/client';

@Injectable()
export class UpdateList {
  constructor(
    private readonly repository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UpdateList.name);
  }

  async execute(userId: string, listId: string, dto: UpdateListDto): Promise<ListDto> {
    this.logger.log(`Updating list ${listId} for user ${userId}`);

    try {
      const list = await this.repository.findById(listId, userId);

      if (!list) {
        throw new NotFoundException('List not found');
      }

      if (list.isDone) {
        throw new BadRequestException('Cannot rename the Done list');
      }

      const updated = await this.repository.update(listId, userId, { name: dto.name });

      this.logger.log(`Successfully updated list ${listId}`);
      return this.toDto(updated);
    } catch (error) {
      this.logger.error(`Failed to update list ${listId}`, error instanceof Error ? error.stack : undefined);
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
