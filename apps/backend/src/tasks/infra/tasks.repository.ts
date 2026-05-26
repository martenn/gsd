import { Injectable } from '@nestjs/common';
import { PrismaClient, Task, Prisma } from '@prisma/client';

export interface FindManyByListOptions {
  limit?: number;
  offset?: number;
  includeCompleted?: boolean;
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  listId: string;
  originBacklogId: string;
  userId: string;
  orderIndex: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
}

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateTaskData): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        listId: data.listId,
        originBacklogId: data.originBacklogId,
        userId: data.userId,
        orderIndex: data.orderIndex,
      },
    });
  }

  async findById(userId: string, taskId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });
  }

  async findManyByList(
    userId: string,
    listId: string,
    options?: FindManyByListOptions,
  ): Promise<Task[]> {
    const { limit = 100, offset = 0, includeCompleted = false } = options || {};

    return this.prisma.task.findMany({
      where: {
        userId,
        listId,
        completedAt: includeCompleted ? undefined : null,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async findManyByUser(userId: string, options?: FindManyByListOptions): Promise<Task[]> {
    const { limit = 1000, offset = 0, includeCompleted = false } = options || {};

    return this.prisma.task.findMany({
      where: {
        userId,
        completedAt: includeCompleted ? undefined : null,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async update(userId: string, taskId: string, data: UpdateTaskData): Promise<Task> {
    return this.prisma.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async delete(userId: string, taskId: string): Promise<void> {
    await this.prisma.task.delete({
      where: {
        id: taskId,
        userId,
      },
    });
  }

  async countByList(userId: string, listId: string): Promise<number> {
    return this.prisma.task.count({
      where: {
        userId,
        listId,
        completedAt: null,
      },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.task.count({
      where: {
        userId,
        completedAt: null,
      },
    });
  }

  async findMaxOrderIndex(userId: string, listId: string): Promise<number | null> {
    const result = await this.prisma.task.findFirst({
      where: {
        userId,
        listId,
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

  async findMinOrderIndex(userId: string, listId: string): Promise<number | null> {
    const result = await this.prisma.task.findFirst({
      where: {
        userId,
        listId,
      },
      orderBy: {
        orderIndex: 'asc',
      },
      select: {
        orderIndex: true,
      },
    });

    return result?.orderIndex ?? null;
  }

  async findNextBelow(userId: string, listId: string, orderIndex: number): Promise<number | null> {
    const result = await this.prisma.task.findFirst({
      where: {
        userId,
        listId,
        orderIndex: { lt: orderIndex },
        completedAt: null,
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

  async reindexListTasks(userId: string, listId: string, newIndices: number[]): Promise<void> {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        listId,
      },
      orderBy: {
        orderIndex: 'asc',
      },
      select: {
        id: true,
      },
    });

    await this.prisma.$transaction(
      tasks.map((task: { id: string }, index: number) =>
        this.prisma.task.update({
          where: { id: task.id },
          data: { orderIndex: newIndices[index] },
        }),
      ),
    );
  }

  async moveTask(
    userId: string,
    taskId: string,
    destinationListId: string,
    newOrderIndex: number,
  ): Promise<Task> {
    return this.prisma.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        listId: destinationListId,
        orderIndex: newOrderIndex,
      },
    });
  }

  // Atomically relocate all non-completed tasks from sourceListId to destinationListId,
  // placing them at the top of the destination while preserving their relative order.
  async moveAllNonCompletedTasks(
    userId: string,
    sourceListId: string,
    destinationListId: string,
  ): Promise<number> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sourceTasks = await tx.task.findMany({
        where: {
          userId,
          listId: sourceListId,
          completedAt: null,
        },
        orderBy: { orderIndex: 'asc' },
        select: { id: true },
      });

      if (sourceTasks.length === 0) {
        return 0;
      }

      const maxDestOrder = await tx.task.findFirst({
        where: { userId, listId: destinationListId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      const base = maxDestOrder?.orderIndex ?? 0;
      const STEP = 1000;

      // sourceTasks is ASC (bottom-of-source first). Assigning base + (i+1)*STEP
      // keeps relative order: the source top ends up with the highest orderIndex,
      // which renders at the top of the destination.
      for (let i = 0; i < sourceTasks.length; i++) {
        await tx.task.update({
          where: { id: sourceTasks[i].id },
          data: {
            listId: destinationListId,
            orderIndex: base + (i + 1) * STEP,
          },
        });
      }

      return sourceTasks.length;
    });
  }

  async completeTask(userId: string, taskId: string, doneListId: string): Promise<Task> {
    const maxOrderIndex = await this.findMaxOrderIndex(userId, doneListId);
    const newOrderIndex = maxOrderIndex !== null ? maxOrderIndex + 1000 : 1000;

    return this.prisma.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        completedAt: new Date(),
        listId: doneListId,
        orderIndex: newOrderIndex,
      },
    });
  }

  async updateOrderIndex(userId: string, taskId: string, newOrderIndex: number): Promise<Task> {
    return this.prisma.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        orderIndex: newOrderIndex,
      },
    });
  }

  async reassignOriginBacklog(
    userId: string,
    oldOriginBacklogId: string,
    newOriginBacklogId: string,
  ): Promise<number> {
    const result = await this.prisma.task.updateMany({
      where: {
        userId,
        originBacklogId: oldOriginBacklogId,
      },
      data: {
        originBacklogId: newOriginBacklogId,
      },
    });

    return result.count;
  }
}
