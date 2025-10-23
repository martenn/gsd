import { Injectable } from '@nestjs/common';
import { PrismaClient, List } from '@prisma/client';

@Injectable()
export class ListsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByUserId(userId: string, includeDone: boolean = false): Promise<List[]> {
    return this.prisma.list.findMany({
      where: {
        userId,
        isDone: includeDone ? undefined : false,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }

  async countByUserId(userId: string, includeDone: boolean = false): Promise<number> {
    return this.prisma.list.count({
      where: {
        userId,
        isDone: includeDone ? undefined : false,
      },
    });
  }

  async findMaxOrderIndex(userId: string): Promise<number | null> {
    const result = await this.prisma.list.findFirst({
      where: {
        userId,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });

    return result?.orderIndex ?? null;
  }

  async create(data: {
    name: string;
    isBacklog: boolean;
    color: string | null;
    userId: string;
    orderIndex: number;
    isDone: boolean;
  }): Promise<List> {
    return this.prisma.list.create({
      data,
    });
  }
}
