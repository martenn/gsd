import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ListDto } from '@gsd/types';
import { ReorderListDto } from '../dto/reorder-list.dto';
import { ListsRepository } from '../infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';
import { List } from '@prisma/client';

@Injectable()
export class ReorderList {
  constructor(
    private readonly repository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ReorderList.name);
  }

  async execute(userId: string, listId: string, dto: ReorderListDto): Promise<ListDto> {
    this.logger.log(`Reordering list ${listId} for user ${userId}`);

    try {
      const list = await this.repository.findById(listId, userId);

      if (!list) {
        throw new NotFoundException('List not found');
      }

      if (list.isDone) {
        throw new BadRequestException('Cannot reorder the Done list');
      }

      let newOrderIndex: number;

      if (dto.afterListId) {
        newOrderIndex = await this.calculateOrderIndexAfter(userId, dto.afterListId);
      } else if (dto.newOrderIndex !== undefined) {
        newOrderIndex = dto.newOrderIndex;
      } else {
        throw new BadRequestException('Either newOrderIndex or afterListId must be provided');
      }

      const updated = await this.repository.update(listId, userId, { orderIndex: newOrderIndex });

      this.logger.log(`Successfully reordered list ${listId} to orderIndex ${newOrderIndex}`);
      return this.toDto(updated);
    } catch (error) {
      this.logger.error(
        `Failed to reorder list ${listId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async calculateOrderIndexAfter(userId: string, afterListId: string): Promise<number> {
    const targetList = await this.repository.findById(afterListId, userId);

    if (!targetList) {
      throw new NotFoundException('Target list (afterListId) not found');
    }

    const allLists = await this.repository.findManyByUserId(userId, false);
    const sortedLists = allLists.sort((a, b) => a.orderIndex - b.orderIndex);

    const targetIndex = sortedLists.findIndex((l) => l.id === afterListId);
    const nextList = sortedLists[targetIndex + 1];

    if (nextList) {
      return (targetList.orderIndex + nextList.orderIndex) / 2;
    } else {
      return targetList.orderIndex + 1;
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
