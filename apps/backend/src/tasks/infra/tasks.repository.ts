import { Injectable } from '@nestjs/common';
import { PrismaClient, Task } from '@prisma/client';

export interface FindManyByListOptions {
  limit?: number;
  offset?: number;
  includeCompleted?: boolean;
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  listId: string;
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
      tasks.map((task, index) =>
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
}
