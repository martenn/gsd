import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteList } from './delete-list';
import { ListsRepository } from '../infra/lists.repository';
import { TasksRepository } from '../../tasks/infra/tasks.repository';
import { ColorPool } from '../../colors/color-pool';
import { Color } from '../../colors/color';
import { AppLogger } from '../../logger/app-logger';

describe('DeleteList', () => {
  let useCase: DeleteList;
  let repository: ListsRepository;
  let tasksRepository: TasksRepository;
  let colorPool: ColorPool;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      countBacklogs: jest.fn(),
      findFirstIntermediate: jest.fn(),
      findFirstBacklog: jest.fn(),
      findBacklogs: jest.fn(),
      promoteToBacklog: jest.fn(),
      deleteWithTaskMove: jest.fn(),
      findManyByUserId: jest.fn(),
    } as unknown as ListsRepository;

    tasksRepository = {
      reassignOriginBacklog: jest.fn(),
    } as unknown as TasksRepository;

    colorPool = {
      getNextColor: jest.fn(),
      markColorAsUsed: jest.fn(),
      releaseColor: jest.fn(),
      getAvailableColors: jest.fn(),
      getPalette: jest.fn(),
    } as unknown as ColorPool;

    const logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as unknown as AppLogger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteList,
        {
          provide: ListsRepository,
          useValue: repository,
        },
        {
          provide: TasksRepository,
          useValue: tasksRepository,
        },
        {
          provide: ColorPool,
          useValue: colorPool,
        },
        {
          provide: AppLogger,
          useValue: logger,
        },
      ],
    }).compile();

    useCase = module.get<DeleteList>(DeleteList);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('successful deletion scenarios', () => {
    it('should delete intermediate list and move tasks to specified destination', async () => {
      const userId = 'test-user-1';
      const listId = 'intermediate-list-id';
      const destListId = 'destination-list-id';
      const now = new Date();

      const intermediateList = {
        id: listId,
        name: 'Intermediate List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: '#3B82F6',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const destinationList = {
        id: destListId,
        name: 'Destination List',
        orderIndex: 3.0,
        isBacklog: false,
        isDone: false,
        color: '#EF4444',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest
        .spyOn(repository, 'findById')
        .mockResolvedValueOnce(intermediateList) // For source list
        .mockResolvedValueOnce(destinationList); // For destination validation

      jest.spyOn(repository, 'deleteWithTaskMove').mockResolvedValue(undefined);
      jest.spyOn(colorPool, 'releaseColor').mockImplementation(() => {});

      await useCase.execute(userId, listId, destListId);

      expect(repository.findById).toHaveBeenCalledWith(listId, userId);
      expect(repository.findById).toHaveBeenCalledWith(destListId, userId);
      expect(repository.deleteWithTaskMove).toHaveBeenCalledWith(listId, destListId, userId);
      expect(colorPool.releaseColor).toHaveBeenCalledWith(Color.of('#3B82F6'));
    });

    it('should delete backlog when multiple backlogs exist', async () => {
      const userId = 'test-user-1';
      const listId = 'backlog-list-id';
      const destListId = 'destination-list-id';
      const now = new Date();

      const backlogList = {
        id: listId,
        name: 'Backlog List',
        orderIndex: 1.0,
        isBacklog: true,
        isDone: false,
        color: '#10B981',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const otherBacklog = {
        id: 'other-backlog-id',
        name: 'Other Backlog',
        orderIndex: 0.5,
        isBacklog: true,
        isDone: false,
        color: '#8B5CF6',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const destinationList = {
        id: destListId,
        name: 'Destination List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: '#F59E0B',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest
        .spyOn(repository, 'findById')
        .mockResolvedValueOnce(backlogList)
        .mockResolvedValueOnce(destinationList);

      jest.spyOn(repository, 'countBacklogs').mockResolvedValue(2); // Multiple backlogs exist
      jest.spyOn(repository, 'findBacklogs').mockResolvedValue([backlogList, otherBacklog]);
      jest.spyOn(tasksRepository, 'reassignOriginBacklog').mockResolvedValue(5);
      jest.spyOn(repository, 'deleteWithTaskMove').mockResolvedValue(undefined);
      jest.spyOn(colorPool, 'releaseColor').mockImplementation(() => {});

      await useCase.execute(userId, listId, destListId);

      expect(repository.countBacklogs).toHaveBeenCalledWith(userId);
      expect(repository.findBacklogs).toHaveBeenCalledWith(userId);
      expect(tasksRepository.reassignOriginBacklog).toHaveBeenCalledWith(
        userId,
        listId,
        otherBacklog.id,
      );
      expect(repository.deleteWithTaskMove).toHaveBeenCalledWith(listId, destListId, userId);
      expect(colorPool.releaseColor).toHaveBeenCalledWith(Color.of('#10B981'));
    });

    it('should auto-promote leftmost intermediate when deleting last backlog', async () => {
      const userId = 'test-user-1';
      const listId = 'last-backlog-id';
      const destListId = 'destination-list-id';
      const now = new Date();

      const lastBacklog = {
        id: listId,
        name: 'Last Backlog',
        orderIndex: 1.0,
        isBacklog: true,
        isDone: false,
        color: '#8B5CF6',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const intermediateToPromote = {
        id: 'intermediate-to-promote',
        name: 'Intermediate List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: '#EC4899',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const destinationList = {
        id: destListId,
        name: 'Destination List',
        orderIndex: 3.0,
        isBacklog: false,
        isDone: false,
        color: '#06B6D4',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest
        .spyOn(repository, 'findById')
        .mockResolvedValueOnce(lastBacklog)
        .mockResolvedValueOnce(destinationList);

      const promotedBacklog = {
        ...intermediateToPromote,
        isBacklog: true,
      };

      jest.spyOn(repository, 'countBacklogs').mockResolvedValue(1); // Last backlog
      jest.spyOn(repository, 'findFirstIntermediate').mockResolvedValue(intermediateToPromote);
      jest.spyOn(repository, 'promoteToBacklog').mockResolvedValue(promotedBacklog);
      jest.spyOn(repository, 'findBacklogs').mockResolvedValue([lastBacklog, promotedBacklog]);
      jest.spyOn(tasksRepository, 'reassignOriginBacklog').mockResolvedValue(3);
      jest.spyOn(repository, 'deleteWithTaskMove').mockResolvedValue(undefined);
      jest.spyOn(colorPool, 'releaseColor').mockImplementation(() => {});

      await useCase.execute(userId, listId, destListId);

      expect(repository.countBacklogs).toHaveBeenCalledWith(userId);
      expect(repository.findFirstIntermediate).toHaveBeenCalledWith(userId);
      expect(repository.promoteToBacklog).toHaveBeenCalledWith(intermediateToPromote.id);
      expect(repository.findBacklogs).toHaveBeenCalledWith(userId);
      expect(tasksRepository.reassignOriginBacklog).toHaveBeenCalledWith(
        userId,
        listId,
        promotedBacklog.id,
      );
      expect(repository.promoteToBacklog).toHaveBeenCalledWith('intermediate-to-promote');
      expect(repository.deleteWithTaskMove).toHaveBeenCalledWith(listId, destListId, userId);
    });

    it('should use default intermediate list when no destination specified', async () => {
      const userId = 'test-user-1';
      const listId = 'intermediate-list-id';
      const now = new Date();

      const intermediateList = {
        id: listId,
        name: 'Intermediate List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: '#84CC16',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const defaultDestination = {
        id: 'default-intermediate',
        name: 'Default Intermediate',
        orderIndex: 1.0,
        isBacklog: false,
        isDone: false,
        color: '#F97316',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest.spyOn(repository, 'findById').mockResolvedValueOnce(intermediateList);
      jest.spyOn(repository, 'findFirstIntermediate').mockResolvedValue(defaultDestination);
      jest.spyOn(repository, 'deleteWithTaskMove').mockResolvedValue(undefined);
      jest.spyOn(colorPool, 'releaseColor').mockImplementation(() => {});

      await useCase.execute(userId, listId);

      expect(repository.findFirstIntermediate).toHaveBeenCalledWith(userId);
      expect(repository.deleteWithTaskMove).toHaveBeenCalledWith(
        listId,
        'default-intermediate',
        userId,
      );
    });

    it('should fall back to backlog when no intermediate exists', async () => {
      const userId = 'test-user-1';
      const listId = 'intermediate-list-id';
      const now = new Date();

      const intermediateList = {
        id: listId,
        name: 'Intermediate List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: '#6366F1',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const fallbackBacklog = {
        id: 'fallback-backlog',
        name: 'Fallback Backlog',
        orderIndex: 1.0,
        isBacklog: true,
        isDone: false,
        color: '#14B8A6',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest.spyOn(repository, 'findById').mockResolvedValueOnce(intermediateList);
      jest.spyOn(repository, 'findFirstIntermediate').mockResolvedValue(null);
      jest.spyOn(repository, 'findFirstBacklog').mockResolvedValue(fallbackBacklog);
      jest.spyOn(repository, 'deleteWithTaskMove').mockResolvedValue(undefined);
      jest.spyOn(colorPool, 'releaseColor').mockImplementation(() => {});

      await useCase.execute(userId, listId);

      expect(repository.findFirstIntermediate).toHaveBeenCalledWith(userId);
      expect(repository.findFirstBacklog).toHaveBeenCalledWith(userId);
      expect(repository.deleteWithTaskMove).toHaveBeenCalledWith(
        listId,
        'fallback-backlog',
        userId,
      );
    });

    it('should not release color when list has no color', async () => {
      const userId = 'test-user-1';
      const listId = 'intermediate-list-id';
      const destListId = 'destination-list-id';
      const now = new Date();

      const intermediateList = {
        id: listId,
        name: 'Intermediate List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: null,
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const destinationList = {
        id: destListId,
        name: 'Destination List',
        orderIndex: 3.0,
        isBacklog: false,
        isDone: false,
        color: '#DC2626',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest
        .spyOn(repository, 'findById')
        .mockResolvedValueOnce(intermediateList)
        .mockResolvedValueOnce(destinationList);

      jest.spyOn(repository, 'deleteWithTaskMove').mockResolvedValue(undefined);

      await useCase.execute(userId, listId, destListId);

      expect(colorPool.releaseColor).not.toHaveBeenCalled();
    });
  });

  describe('error scenarios', () => {
    it('should throw NotFoundException when list not found', async () => {
      const userId = 'test-user-1';
      const listId = 'non-existent-list';

      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(useCase.execute(userId, listId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(userId, listId)).rejects.toThrow('List not found');

      expect(repository.deleteWithTaskMove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting Done list', async () => {
      const userId = 'test-user-1';
      const listId = 'done-list-id';
      const now = new Date();

      const doneList = {
        id: listId,
        name: 'Done List',
        orderIndex: 1.0,
        isBacklog: false,
        isDone: true,
        color: '#059669',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(doneList);

      await expect(useCase.execute(userId, listId)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, listId)).rejects.toThrow('Cannot delete Done list');

      expect(repository.deleteWithTaskMove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting last backlog with no intermediates', async () => {
      const userId = 'test-user-1';
      const listId = 'last-backlog-id';
      const now = new Date();

      const lastBacklog = {
        id: listId,
        name: 'Last Backlog',
        orderIndex: 1.0,
        isBacklog: true,
        isDone: false,
        color: '#7C3AED',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(lastBacklog);
      jest.spyOn(repository, 'countBacklogs').mockResolvedValue(1); // Last backlog
      jest.spyOn(repository, 'findFirstIntermediate').mockResolvedValue(null); // No intermediates

      await expect(useCase.execute(userId, listId)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, listId)).rejects.toThrow(
        'Cannot delete last backlog with no intermediate lists to promote',
      );

      expect(repository.promoteToBacklog).not.toHaveBeenCalled();
      expect(repository.deleteWithTaskMove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when destination list not found', async () => {
      const userId = 'test-user-1';
      const listId = 'intermediate-list-id';
      const destListId = 'non-existent-dest';

      const intermediateList = {
        id: listId,
        name: 'Intermediate List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: '#BE185D',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'findById').mockImplementation((id: string) => {
        if (id === listId) return Promise.resolve(intermediateList);
        if (id === destListId) return Promise.resolve(null);
        return Promise.resolve(null);
      });

      await expect(useCase.execute(userId, listId, destListId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(userId, listId, destListId)).rejects.toThrow(
        'Destination list not found',
      );

      expect(repository.deleteWithTaskMove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when destination is Done list', async () => {
      const userId = 'test-user-1';
      const listId = 'intermediate-list-id';
      const destListId = 'done-list-id';
      const now = new Date();

      const intermediateList = {
        id: listId,
        name: 'Intermediate List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: '#3B82F6',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const doneList = {
        id: destListId,
        name: 'Done List',
        orderIndex: 1.0,
        isBacklog: false,
        isDone: true,
        color: '#EF4444',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest.spyOn(repository, 'findById').mockImplementation((id: string) => {
        if (id === listId) return Promise.resolve(intermediateList);
        if (id === destListId) return Promise.resolve(doneList);
        return Promise.resolve(null);
      });

      await expect(useCase.execute(userId, listId, destListId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(userId, listId, destListId)).rejects.toThrow(
        'Cannot move tasks to Done list',
      );

      expect(repository.deleteWithTaskMove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when destination equals source list', async () => {
      const userId = 'test-user-1';
      const listId = 'intermediate-list-id';
      const now = new Date();

      const intermediateList = {
        id: listId,
        name: 'Intermediate List',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: '#10B981',
        userId,
        createdAt: now,
        updatedAt: now,
      };

      jest.spyOn(repository, 'findById').mockImplementation((id: string) => {
        if (id === listId) return Promise.resolve(intermediateList);
        return Promise.resolve(null);
      });

      await expect(useCase.execute(userId, listId, listId)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, listId, listId)).rejects.toThrow(
        'Cannot move tasks to same list',
      );

      expect(repository.deleteWithTaskMove).not.toHaveBeenCalled();
    });
  });
});
