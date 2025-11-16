import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ToggleBacklog } from './toggle-backlog';
import { ListsRepository } from '../infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

describe('ToggleBacklog', () => {
  let useCase: ToggleBacklog;
  let repository: ListsRepository;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      countBacklogs: jest.fn(),
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
        ToggleBacklog,
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

    useCase = module.get<ToggleBacklog>(ToggleBacklog);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully toggle backlog on (false to true)', async () => {
    const userId = 'test-user-1';
    const listId = 'list-1';
    const now = new Date();

    const intermediateList = {
      id: listId,
      name: 'Intermediate List',
      orderIndex: 5.0,
      isBacklog: false,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const toggledList = {
      ...intermediateList,
      isBacklog: true,
      updatedAt: new Date(),
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(intermediateList);
    jest.spyOn(repository, 'update').mockResolvedValue(toggledList);

    const result = await useCase.execute(userId, listId);

    expect(repository.findById).toHaveBeenCalledWith(listId, userId);
    expect(repository.countBacklogs).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(listId, userId, { isBacklog: true });
    expect(result.isBacklog).toBe(true);
    expect(result.id).toBe(listId);
  });

  it('should successfully toggle backlog off (true to false) when multiple backlogs exist', async () => {
    const userId = 'test-user-1';
    const listId = 'backlog-2';
    const now = new Date();

    const backlogList = {
      id: listId,
      name: 'Backlog 2',
      orderIndex: 2.0,
      isBacklog: true,
      isDone: false,
      color: '#EF4444',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const toggledList = {
      ...backlogList,
      isBacklog: false,
      updatedAt: new Date(),
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(backlogList);
    jest.spyOn(repository, 'countBacklogs').mockResolvedValue(2);
    jest.spyOn(repository, 'update').mockResolvedValue(toggledList);

    const result = await useCase.execute(userId, listId);

    expect(repository.findById).toHaveBeenCalledWith(listId, userId);
    expect(repository.countBacklogs).toHaveBeenCalledWith(userId);
    expect(repository.update).toHaveBeenCalledWith(listId, userId, { isBacklog: false });
    expect(result.isBacklog).toBe(false);
  });

  it('should throw BadRequestException when trying to unmark last backlog', async () => {
    const userId = 'test-user-1';
    const listId = 'last-backlog';
    const now = new Date();

    const lastBacklog = {
      id: listId,
      name: 'Last Backlog',
      orderIndex: 1.0,
      isBacklog: true,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'findById').mockResolvedValue(lastBacklog);
    jest.spyOn(repository, 'countBacklogs').mockResolvedValue(1);

    await expect(useCase.execute(userId, listId)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(userId, listId)).rejects.toThrow(
      'Cannot unmark the last backlog. At least one backlog must exist.',
    );

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when trying to toggle Done list', async () => {
    const userId = 'test-user-1';
    const listId = 'done-list';
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

    await expect(useCase.execute(userId, listId)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(userId, listId)).rejects.toThrow(
      'Cannot toggle backlog status of the Done list',
    );

    expect(repository.countBacklogs).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when list does not exist', async () => {
    const userId = 'test-user-1';
    const listId = 'non-existent-list';

    jest.spyOn(repository, 'findById').mockResolvedValue(null);

    await expect(useCase.execute(userId, listId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(userId, listId)).rejects.toThrow('List not found');

    expect(repository.countBacklogs).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
