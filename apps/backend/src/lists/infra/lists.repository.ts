import { Injectable } from '@nestjs/common';
import { PrismaClient, List, Prisma } from '@prisma/client';

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

  async findById(id: string, userId: string): Promise<List | null> {
    return this.prisma.list.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async countBacklogs(userId: string): Promise<number> {
    return this.prisma.list.count({
      where: {
        userId,
        isBacklog: true,
        isDone: false,
      },
    });
  }

  async findFirstIntermediate(userId: string): Promise<List | null> {
    return this.prisma.list.findFirst({
      where: {
        userId,
        isBacklog: false,
        isDone: false,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }

  async findFirstBacklog(userId: string): Promise<List | null> {
    return this.prisma.list.findFirst({
      where: {
        userId,
        isBacklog: true,
        isDone: false,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }

  async findDoneList(userId: string): Promise<List | null> {
    return this.prisma.list.findFirst({
      where: {
        userId,
        isDone: true,
      },
    });
  }

  async promoteToBacklog(id: string): Promise<List> {
    return this.prisma.list.update({
      where: { id },
      data: { isBacklog: true },
    });
  }

  async deleteWithTaskMove(listId: string, destListId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.task.updateMany({
        where: {
          listId,
          userId,
        },
        data: {
          listId: destListId,
        },
      });

      await tx.list.delete({
        where: {
          id: listId,
          userId,
        },
      });
    });
  }
}
