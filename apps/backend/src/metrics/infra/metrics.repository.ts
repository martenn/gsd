import { Injectable } from '@nestjs/common';
import { PrismaClient, Task } from '@prisma/client';

@Injectable()
export class MetricsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getCompletedTasksByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });
  }
}
