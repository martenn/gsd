import { Injectable, BadRequestException } from '@nestjs/common';
import { ListDto } from '@gsd/types';
import { CreateListDto } from '../dto/create-list.dto';
import { ListsRepository } from '../infra/lists.repository';

const MAX_NON_DONE_LISTS = 10;

@Injectable()
export class CreateList {
  constructor(private readonly repository: ListsRepository) {}

  async execute(userId: string, createListDto: CreateListDto): Promise<ListDto> {
    const currentListCount = await this.repository.countByUserId(userId, false);

    if (currentListCount >= MAX_NON_DONE_LISTS) {
      throw new BadRequestException(
        `Cannot create list - maximum of ${MAX_NON_DONE_LISTS} non-Done lists reached`
      );
    }

    const maxOrderIndex = await this.repository.findMaxOrderIndex(userId);
    const newOrderIndex = maxOrderIndex !== null ? maxOrderIndex + 1 : 1;

    const list = await this.repository.create({
      name: createListDto.name,
      isBacklog: createListDto.isBacklog ?? false,
      color: createListDto.color ?? null,
      userId,
      orderIndex: newOrderIndex,
      isDone: false,
    });

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
