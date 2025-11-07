import { Injectable } from '@nestjs/common';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { ColorPool } from '../../colors/color-pool';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class OnboardUser {
  constructor(
    private readonly listsRepository: ListsRepository,
    private readonly colorPool: ColorPool,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(OnboardUser.name);
  }

  async execute(userId: string): Promise<void> {
    this.logger.log(`Starting onboarding for user: ${userId}`);

    try {
      const existingListCount = await this.listsRepository.countByUserId(userId, true);

      if (existingListCount > 0) {
        this.logger.log(`User ${userId} already has lists, skipping onboarding`);
        return;
      }

      await this.createDefaultLists(userId);

      this.logger.log(`Onboarding completed successfully for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to onboard user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async createDefaultLists(userId: string): Promise<void> {
    const backlogColor = this.colorPool.getNextColor().toString();
    const todayColor = this.colorPool.getNextColor().toString();

    await this.listsRepository.create({
      name: 'Backlog',
      isBacklog: true,
      isDone: false,
      color: backlogColor,
      userId,
      orderIndex: 1,
    });

    this.logger.log(`Created default backlog for user: ${userId}`);

    await this.listsRepository.create({
      name: 'Today',
      isBacklog: false,
      isDone: false,
      color: todayColor,
      userId,
      orderIndex: 2,
    });

    this.logger.log(`Created default "Today" list for user: ${userId}`);

    await this.listsRepository.create({
      name: 'Done',
      isBacklog: false,
      isDone: true,
      color: null,
      userId,
      orderIndex: 3,
    });

    this.logger.log(`Created "Done" list for user: ${userId}`);
  }
}
