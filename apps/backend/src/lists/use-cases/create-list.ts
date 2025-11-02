import { Injectable, BadRequestException } from '@nestjs/common';
import { ListDto } from '@gsd/types';
import { CreateListDto } from '../dto/create-list.dto';
import { ListsRepository } from '../infra/lists.repository';
import { ColorPool } from '../../colors/color-pool';
import { Color } from '../../colors/color';
import { AppLogger } from '../../logger/app-logger';

const MAX_NON_DONE_LISTS = 10;

@Injectable()
export class CreateList {
  constructor(
    private readonly repository: ListsRepository,
    private readonly colorPool: ColorPool,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CreateList.name);
  }

  async execute(userId: string, createListDto: CreateListDto): Promise<ListDto> {
    this.logger.log(`Creating list for user ${userId}: ${createListDto.name}`);

    try {
      await this.validateMaxListCount(userId);

      const newOrderIndex = await this.selectOrderIndex(userId);
      const assignedColor = this.selectColor(createListDto);

      const list = await this.repository.create({
        name: createListDto.name,
        isBacklog: createListDto.isBacklog ?? false,
        color: assignedColor,
        userId,
        orderIndex: newOrderIndex,
        isDone: false,
      });

      this.logger.log(`List created successfully: ${list.id}`);

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
    } catch (error) {
      this.logger.error(
        `Failed to create list for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async selectOrderIndex(userId: string) {
    const maxOrderIndex = await this.repository.findMaxOrderIndex(userId);
    return maxOrderIndex !== null ? maxOrderIndex + 1 : 1;
  }

  private async validateMaxListCount(userId: string) {
    const currentListCount = await this.repository.countByUserId(userId, false);

    if (currentListCount >= MAX_NON_DONE_LISTS) {
      throw new BadRequestException(
        `Cannot create list - maximum of ${MAX_NON_DONE_LISTS} non-Done lists reached`,
      );
    }
  }

  private selectColor(createListDto: CreateListDto): string {
    try {
      if (createListDto.color) {
        const color = Color.of(createListDto.color);
        this.colorPool.markColorAsUsed(color);
        return color.toString();
      } else {
        return this.colorPool.getNextColor().toString();
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to assign color to list',
      );
    }
  }
}
