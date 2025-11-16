import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReorderList } from './reorder-list';
import { ReorderListDto } from '../dto/reorder-list.dto';
import { ListsRepository } from '../infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

describe('ReorderList', () => {
  let useCase: ReorderList;
  let repository: ListsRepository;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      findManyByUserId: jest.fn(),
      update: jest.fn(),
    } as unknown as ListsRepository;

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
        ReorderList,
        {
          provide: ListsRepository,
          useValue: repository,
        },
        {
          provide: AppLogger,
          useValue: logger,
        },
      ],
    }).compile();

    useCase = module.get<ReorderList>(ReorderList);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully reorder with explicit newOrderIndex', async () => {
    const userId = 'test-user-1';
    const listId = 'list-1';
    const reorderDto: ReorderListDto = {
      newOrderIndex: 5.0,
    };
    const now = new Date();

    const existingList = {
      id: listId,
      name: 'List to Reorder',
      orderIndex: 3.0,
      isBacklog: false,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const reorderedList = {
      ...existingList,
      orderIndex: 5.0,
      updatedAt: new Date(),
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(existingList);
    jest.spyOn(repository, 'update').mockResolvedValue(reorderedList);

    const result = await useCase.execute(userId, listId, reorderDto);

    expect(repository.findById).toHaveBeenCalledWith(listId, userId);
    expect(repository.update).toHaveBeenCalledWith(listId, userId, { orderIndex: 5.0 });
    expect(result.orderIndex).toBe(5.0);
    expect(result.id).toBe(listId);
  });

  it('should successfully reorder with afterListId using fractional indexing', async () => {
    const userId = 'test-user-1';
    const listId = 'list-to-move';
    const targetListId = 'list-2';
    const reorderDto: ReorderListDto = {
      afterListId: targetListId,
    };
    const now = new Date();

    const listToMove = {
      id: listId,
      name: 'List to Move',
      orderIndex: 1.0,
      isBacklog: false,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const targetList = {
      id: targetListId,
      name: 'Target List',
      orderIndex: 2.0,
      isBacklog: false,
      isDone: false,
      color: '#EF4444',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const nextList = {
      id: 'list-3',
      name: 'Next List',
      orderIndex: 4.0,
      isBacklog: false,
      isDone: false,
      color: '#10B981',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const allLists = [listToMove, targetList, nextList];

    const reorderedList = {
      ...listToMove,
      orderIndex: 3.0,
      updatedAt: new Date(),
    };

    jest.spyOn(repository, 'findById').mockImplementation(async (id: string) => {
      if (id === listId) return listToMove;
      if (id === targetListId) return targetList;
      return null;
    });
    jest.spyOn(repository, 'findManyByUserId').mockResolvedValue(allLists);
    jest.spyOn(repository, 'update').mockResolvedValue(reorderedList);

    const result = await useCase.execute(userId, listId, reorderDto);

    expect(repository.findById).toHaveBeenCalledWith(targetListId, userId);
    expect(repository.findManyByUserId).toHaveBeenCalledWith(userId, false);
    expect(repository.update).toHaveBeenCalledWith(listId, userId, { orderIndex: 3.0 });
    expect(result.orderIndex).toBe(3.0);
  });

  it('should handle reordering to end when no next list exists', async () => {
    const userId = 'test-user-1';
    const listId = 'list-to-move';
    const targetListId = 'last-list';
    const reorderDto: ReorderListDto = {
      afterListId: targetListId,
    };
    const now = new Date();

    const listToMove = {
      id: listId,
      name: 'List to Move',
      orderIndex: 1.0,
      isBacklog: false,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const lastList = {
      id: targetListId,
      name: 'Last List',
      orderIndex: 5.0,
      isBacklog: false,
      isDone: false,
      color: '#EF4444',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const allLists = [listToMove, lastList];

    const reorderedList = {
      ...listToMove,
      orderIndex: 6.0,
      updatedAt: new Date(),
    };

    jest.spyOn(repository, 'findById').mockImplementation(async (id: string) => {
      if (id === listId) return listToMove;
      if (id === targetListId) return lastList;
      return null;
    });
    jest.spyOn(repository, 'findManyByUserId').mockResolvedValue(allLists);
    jest.spyOn(repository, 'update').mockResolvedValue(reorderedList);

    const result = await useCase.execute(userId, listId, reorderDto);

    expect(repository.update).toHaveBeenCalledWith(listId, userId, { orderIndex: 6.0 });
    expect(result.orderIndex).toBe(6.0);
  });

  it('should throw BadRequestException when trying to reorder Done list', async () => {
    const userId = 'test-user-1';
    const listId = 'done-list';
    const reorderDto: ReorderListDto = {
      newOrderIndex: 5.0,
    };
    const now = new Date();

    const doneList = {
      id: listId,
      name: 'Done',
      orderIndex: 99.0,
      isBacklog: false,
      isDone: true,
      color: null,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(doneList);

    await expect(useCase.execute(userId, listId, reorderDto)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(userId, listId, reorderDto)).rejects.toThrow('Cannot reorder the Done list');

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when list does not exist', async () => {
    const userId = 'test-user-1';
    const listId = 'non-existent-list';
    const reorderDto: ReorderListDto = {
      newOrderIndex: 3.0,
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(null);

    await expect(useCase.execute(userId, listId, reorderDto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(userId, listId, reorderDto)).rejects.toThrow('List not found');

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when afterListId does not exist', async () => {
    const userId = 'test-user-1';
    const listId = 'list-1';
    const targetListId = 'non-existent-target';
    const reorderDto: ReorderListDto = {
      afterListId: targetListId,
    };
    const now = new Date();

    const existingList = {
      id: listId,
      name: 'List to Move',
      orderIndex: 1.0,
      isBacklog: false,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'findById').mockImplementation(async (id: string) => {
      if (id === listId) return existingList;
      return null;
    });

    await expect(useCase.execute(userId, listId, reorderDto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(userId, listId, reorderDto)).rejects.toThrow(
      'Target list (afterListId) not found',
    );

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when neither parameter is provided', async () => {
    const userId = 'test-user-1';
    const listId = 'list-1';
    const reorderDto: ReorderListDto = {};
    const now = new Date();

    const existingList = {
      id: listId,
      name: 'List',
      orderIndex: 1.0,
      isBacklog: false,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(existingList);

    await expect(useCase.execute(userId, listId, reorderDto)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(userId, listId, reorderDto)).rejects.toThrow(
      'Either newOrderIndex or afterListId must be provided',
    );

    expect(repository.update).not.toHaveBeenCalled();
  });
});
