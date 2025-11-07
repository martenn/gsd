import { Test, TestingModule } from '@nestjs/testing';
import { OnboardUser } from './onboard-user';
import { CreateList } from '../../lists/use-cases/create-list';
import { GetLists } from '../../lists/use-cases/get-lists';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';
import { ListDto } from '@gsd/types';

describe('OnboardUser', () => {
  let useCase: OnboardUser;
  let getListsUseCase: jest.Mocked<GetLists>;
  let createListUseCase: jest.Mocked<CreateList>;
  let listsRepository: jest.Mocked<ListsRepository>;
  let logger: jest.Mocked<AppLogger>;

  beforeEach(async () => {
    const mockGetLists = {
      execute: jest.fn(),
    };

    const mockCreateList = {
      execute: jest.fn(),
    };

    const mockListsRepository = {
      findMaxOrderIndex: jest.fn(),
      create: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardUser,
        { provide: GetLists, useValue: mockGetLists },
        { provide: CreateList, useValue: mockCreateList },
        { provide: ListsRepository, useValue: mockListsRepository },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    useCase = module.get<OnboardUser>(OnboardUser);
    getListsUseCase = module.get(GetLists);
    createListUseCase = module.get(CreateList);
    listsRepository = module.get(ListsRepository);
    logger = module.get(AppLogger);
  });

  describe('execute', () => {
    const userId = 'user-id-123';

    it('should create default lists for new user with no existing lists', async () => {
      getListsUseCase.execute.mockResolvedValue([]);

      const backlogList: ListDto = {
        id: 'list-1',
        name: 'Backlog',
        orderIndex: 1,
        isBacklog: true,
        isDone: false,
        color: '#3B82F6',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const todayList: ListDto = {
        id: 'list-2',
        name: 'Today',
        orderIndex: 2,
        isBacklog: false,
        isDone: false,
        color: '#EF4444',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createListUseCase.execute
        .mockResolvedValueOnce(backlogList)
        .mockResolvedValueOnce(todayList);

      listsRepository.findMaxOrderIndex.mockResolvedValue(2);
      listsRepository.create.mockResolvedValue({
        id: 'list-3',
        name: 'Done',
        orderIndex: 3,
        isBacklog: false,
        isDone: true,
        color: null,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await useCase.execute(userId);

      expect(getListsUseCase.execute).toHaveBeenCalledWith(userId);

      expect(createListUseCase.execute).toHaveBeenCalledTimes(2);
      expect(createListUseCase.execute).toHaveBeenNthCalledWith(1, userId, {
        name: 'Backlog',
        isBacklog: true,
      });
      expect(createListUseCase.execute).toHaveBeenNthCalledWith(2, userId, {
        name: 'Today',
        isBacklog: false,
      });

      expect(listsRepository.findMaxOrderIndex).toHaveBeenCalledWith(userId);
      expect(listsRepository.create).toHaveBeenCalledWith({
        name: 'Done',
        isBacklog: false,
        isDone: true,
        color: null,
        userId,
        orderIndex: 3,
      });

      expect(logger.log).toHaveBeenCalledWith(`Starting onboarding for user: ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(`Created default backlog for user: ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(`Created default "Today" list for user: ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(`Created "Done" list for user: ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(`Onboarding completed successfully for user: ${userId}`);
    });

    it('should skip onboarding when user already has lists', async () => {
      const existingList: ListDto = {
        id: 'existing-list',
        name: 'Existing List',
        orderIndex: 1,
        isBacklog: true,
        isDone: false,
        color: '#3B82F6',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getListsUseCase.execute.mockResolvedValue([existingList]);

      await useCase.execute(userId);

      expect(getListsUseCase.execute).toHaveBeenCalledWith(userId);
      expect(createListUseCase.execute).not.toHaveBeenCalled();
      expect(listsRepository.create).not.toHaveBeenCalled();

      expect(logger.log).toHaveBeenCalledWith(`Starting onboarding for user: ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(`User ${userId} already has lists, skipping onboarding`);
    });

    it('should handle Done list creation when no previous lists exist', async () => {
      getListsUseCase.execute.mockResolvedValue([]);
      createListUseCase.execute.mockResolvedValue({} as ListDto);
      listsRepository.findMaxOrderIndex.mockResolvedValue(null);

      await useCase.execute(userId);

      expect(listsRepository.create).toHaveBeenCalledWith({
        name: 'Done',
        isBacklog: false,
        isDone: true,
        color: null,
        userId,
        orderIndex: 1,
      });
    });

    it('should log and re-throw errors during onboarding', async () => {
      const error = new Error('Failed to create list');
      getListsUseCase.execute.mockResolvedValue([]);
      createListUseCase.execute.mockRejectedValue(error);

      await expect(useCase.execute(userId)).rejects.toThrow('Failed to create list');

      expect(logger.error).toHaveBeenCalledWith(
        `Failed to onboard user ${userId}: Failed to create list`,
        expect.any(String),
      );
    });
  });
});
