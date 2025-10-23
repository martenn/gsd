import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateList } from './create-list';
import { CreateListDto } from '../dto/create-list.dto';
import { ListsRepository } from '../infra/lists.repository';

describe('CreateList', () => {
  let useCase: CreateList;
  let repository: ListsRepository;

  beforeEach(async () => {
    repository = {
      countByUserId: jest.fn(),
      findMaxOrderIndex: jest.fn(),
      create: jest.fn(),
    } as unknown as ListsRepository;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateList,
        {
          provide: ListsRepository,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<CreateList>(CreateList);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a new list with default values', async () => {
    const userId = 'test-user-1';
    const createListDto: CreateListDto = {
      name: 'New List',
    };
    const now = new Date();

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(5);
    jest.spyOn(repository, 'findMaxOrderIndex').mockResolvedValue(3.0);

    const createdList = {
      id: 'new-list-id',
      name: 'New List',
      orderIndex: 4.0,
      isBacklog: false,
      isDone: false,
      color: null,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'create').mockResolvedValue(createdList);

    const result = await useCase.execute(userId, createListDto);

    expect(repository.countByUserId).toHaveBeenCalledWith(userId, false);
    expect(repository.create).toHaveBeenCalledWith({
      name: 'New List',
      isBacklog: false,
      color: null,
      userId,
      orderIndex: 4.0,
      isDone: false,
    });
    expect(result).toEqual(createdList);
  });

  it('should create a backlog list with color', async () => {
    const userId = 'test-user-1';
    const createListDto: CreateListDto = {
      name: 'Backlog',
      isBacklog: true,
      color: '#3B82F6',
    };
    const now = new Date();

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(2);
    jest.spyOn(repository, 'findMaxOrderIndex').mockResolvedValue(1.0);

    const createdList = {
      id: 'backlog-id',
      name: 'Backlog',
      orderIndex: 2.0,
      isBacklog: true,
      isDone: false,
      color: '#3B82F6',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'create').mockResolvedValue(createdList);

    const result = await useCase.execute(userId, createListDto);

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Backlog',
      isBacklog: true,
      color: '#3B82F6',
      userId,
      orderIndex: 2.0,
      isDone: false,
    });
    expect(result.isBacklog).toBe(true);
    expect(result.color).toBe('#3B82F6');
  });

  it('should throw BadRequestException when limit reached', async () => {
    const userId = 'test-user-1';
    const createListDto: CreateListDto = {
      name: 'One Too Many',
    };

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(10);

    await expect(useCase.execute(userId, createListDto)).rejects.toThrow(
      BadRequestException
    );
    await expect(useCase.execute(userId, createListDto)).rejects.toThrow(
      'Cannot create list - maximum of 10 non-Done lists reached'
    );

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should set orderIndex to 1 for first list', async () => {
    const userId = 'new-user';
    const createListDto: CreateListDto = {
      name: 'First List',
    };
    const now = new Date();

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(0);
    jest.spyOn(repository, 'findMaxOrderIndex').mockResolvedValue(null);

    const createdList = {
      id: 'first-list-id',
      name: 'First List',
      orderIndex: 1.0,
      isBacklog: false,
      isDone: false,
      color: null,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'create').mockResolvedValue(createdList);

    const result = await useCase.execute(userId, createListDto);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderIndex: 1.0,
      })
    );
    expect(result.orderIndex).toBe(1.0);
  });
});
