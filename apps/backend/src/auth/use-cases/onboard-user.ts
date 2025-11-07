import { Injectable } from '@nestjs/common';
import { CreateList } from '../../lists/use-cases/create-list';
import { GetLists } from '../../lists/use-cases/get-lists';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class OnboardUser {
  constructor(
    private readonly getListsUseCase: GetLists,
    private readonly createListUseCase: CreateList,
    private readonly listsRepository: ListsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(OnboardUser.name);
  }

  async execute(userId: string): Promise<void> {
    this.logger.log(`Starting onboarding for user: ${userId}`);

    try {
      const existingLists = await this.getListsUseCase.execute(userId);

      if (existingLists.length > 0) {
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
    await this.createListUseCase.execute(userId, {
      name: 'Backlog',
      isBacklog: true,
    });

    this.logger.log(`Created default backlog for user: ${userId}`);

    await this.createListUseCase.execute(userId, {
      name: 'Today',
      isBacklog: false,
    });

    this.logger.log(`Created default "Today" list for user: ${userId}`);

    const maxOrderIndex = await this.listsRepository.findMaxOrderIndex(userId);
    await this.listsRepository.create({
      name: 'Done',
      isBacklog: false,
      isDone: true,
      color: null,
      userId,
      orderIndex: (maxOrderIndex ?? 0) + 1,
    });

    this.logger.log(`Created "Done" list for user: ${userId}`);
  }
}
