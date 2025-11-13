import { Injectable } from '@nestjs/common';
import { PrismaClient, Task, List } from '@prisma/client';

export interface CompletedTaskWithList extends Task {
  list: List;
}

@Injectable()
export class DoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCompletedTasks(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<CompletedTaskWithList[]> {
    return this.prisma.task.findMany({
      where: {
        userId,
        completedAt: {
          not: null,
        },
      },
      include: {
        list: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: limit,
      skip: offset,
    }) as Promise<CompletedTaskWithList[]>;
  }

  async countCompletedTasks(userId: string): Promise<number> {
    return this.prisma.task.count({
      where: {
        userId,
        completedAt: {
          not: null,
        },
      },
    });
  }
}
