import { Injectable } from '@nestjs/common';
import { List } from '@prisma/client';
import { ListDto } from '@gsd/types';
import { ListsRepository } from '../infra/lists.repository';

@Injectable()
export class GetLists {
  constructor(private readonly repository: ListsRepository) {}

  async execute(userId: string): Promise<ListDto[]> {
    const lists = await this.repository.findManyByUserId(userId, false);

    return lists.map(
      (list: List): ListDto => ({
        id: list.id,
        name: list.name,
        orderIndex: list.orderIndex,
        isBacklog: list.isBacklog,
        isDone: list.isDone,
        color: list.color,
        userId: list.userId,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      }),
    );
  }
}
