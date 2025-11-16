import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateList } from './update-list';
import { UpdateListDto } from '../dto/update-list.dto';
import { ListsRepository } from '../infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

describe('UpdateList', () => {
  let useCase: UpdateList;
  let repository: ListsRepository;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
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
        UpdateList,
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

    useCase = module.get<UpdateList>(UpdateList);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update list name', async () => {
    const userId = 'test-user-1';
    const listId = 'list-1';
    const updateDto: UpdateListDto = {
      name: 'Updated Name',
    };
    const now = new Date();

    const existingList = {
      id: listId,
      name: 'Old Name',
      orderIndex: 2.0,
      isBacklog: false,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const updatedList = {
      ...existingList,
      name: 'Updated Name',
      updatedAt: new Date(),
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(existingList);
    jest.spyOn(repository, 'update').mockResolvedValue(updatedList);

    const result = await useCase.execute(userId, listId, updateDto);

    expect(repository.findById).toHaveBeenCalledWith(listId, userId);
    expect(repository.update).toHaveBeenCalledWith(listId, userId, { name: 'Updated Name' });
    expect(result.name).toBe('Updated Name');
    expect(result.id).toBe(listId);
  });

  it('should throw NotFoundException when list does not exist', async () => {
    const userId = 'test-user-1';
    const listId = 'non-existent-list';
    const updateDto: UpdateListDto = {
      name: 'New Name',
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(null);

    await expect(useCase.execute(userId, listId, updateDto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(userId, listId, updateDto)).rejects.toThrow('List not found');

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when trying to rename Done list', async () => {
    const userId = 'test-user-1';
    const listId = 'done-list';
    const updateDto: UpdateListDto = {
      name: 'Cannot Rename',
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

    await expect(useCase.execute(userId, listId, updateDto)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(userId, listId, updateDto)).rejects.toThrow('Cannot rename the Done list');

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should successfully update backlog list name', async () => {
    const userId = 'test-user-1';
    const listId = 'backlog-1';
    const updateDto: UpdateListDto = {
      name: 'Renamed Backlog',
    };
    const now = new Date();

    const backlogList = {
      id: listId,
      name: 'Old Backlog',
      orderIndex: 1.0,
      isBacklog: true,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const updatedBacklog = {
      ...backlogList,
      name: 'Renamed Backlog',
      updatedAt: new Date(),
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(backlogList);
    jest.spyOn(repository, 'update').mockResolvedValue(updatedBacklog);

    const result = await useCase.execute(userId, listId, updateDto);

    expect(result.name).toBe('Renamed Backlog');
    expect(result.isBacklog).toBe(true);
  });
});
