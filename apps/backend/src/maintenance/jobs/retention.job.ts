import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { AppLogger } from '../../logger/app-logger';

const RETENTION_LIMIT = 500;

@Injectable()
export class RetentionJob {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RetentionJob.name);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async execute() {
    const startTime = Date.now();
    this.logger.log('Starting retention job');

    try {
      const usersProcessed = await this.cleanupCompletedTasks();
      const duration = Date.now() - startTime;

      this.logger.log(
        `Retention job completed: processed ${usersProcessed.totalUsers} users, ` +
          `deleted ${usersProcessed.totalDeleted} tasks in ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Retention job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async cleanupCompletedTasks(): Promise<{ totalUsers: number; totalDeleted: number }> {
    const usersWithExcessTasks = await this.findUsersWithExcessCompletedTasks();

    let totalDeleted = 0;

    for (const userId of usersWithExcessTasks) {
      try {
        const deleted = await this.deleteOldestCompletedTasksForUser(userId);
        totalDeleted += deleted;
        this.logger.log(`Deleted ${deleted} old completed tasks for user ${userId}`);
      } catch (error) {
        this.logger.error(
          `Failed to cleanup tasks for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return {
      totalUsers: usersWithExcessTasks.length,
      totalDeleted,
    };
  }

  private async findUsersWithExcessCompletedTasks(): Promise<string[]> {
    const results = await this.prisma.task.groupBy({
      by: ['userId'],
      where: {
        completedAt: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: RETENTION_LIMIT,
          },
        },
      },
    });

    return results.map((result) => result.userId);
  }

  private async deleteOldestCompletedTasksForUser(userId: string): Promise<number> {
    const tasksToKeep = await this.prisma.task.findMany({
      where: {
        userId,
        completedAt: {
          not: null,
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: RETENTION_LIMIT,
    });

    const taskIdsToKeep = tasksToKeep.map((task) => task.id);

    const result = await this.prisma.task.deleteMany({
      where: {
        userId,
        completedAt: {
          not: null,
        },
        id: {
          notIn: taskIdsToKeep,
        },
      },
    });

    return result.count;
  }
}
