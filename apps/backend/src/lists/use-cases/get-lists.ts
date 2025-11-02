import { Injectable } from '@nestjs/common';
import { List } from '@prisma/client';
import { ListDto } from '@gsd/types';
import { ListsRepository } from '../infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class GetLists {
  constructor(
    private readonly repository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetLists.name);
  }

  async execute(userId: string): Promise<ListDto[]> {
    this.logger.log(`Fetching lists for user ${userId}`);

    try {
      const lists = await this.repository.findManyByUserId(userId, false);

      this.logger.log(`Found ${lists.length} lists for user ${userId}`);

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
    } catch (error) {
      this.logger.error(
        `Failed to fetch lists for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
