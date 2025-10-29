import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateList } from './create-list';
import { CreateListDto } from '../dto/create-list.dto';
import { ListsRepository } from '../infra/lists.repository';
import { ColorPool } from '../../colors/color-pool';
import { Color } from '../../colors/color';

describe('CreateList', () => {
  let useCase: CreateList;
  let repository: ListsRepository;
  let colorPool: ColorPool;

  beforeEach(async () => {
    repository = {
      countByUserId: jest.fn(),
      findMaxOrderIndex: jest.fn(),
      create: jest.fn(),
    } as unknown as ListsRepository;

    colorPool = {
      getNextColor: jest.fn(),
      markColorAsUsed: jest.fn(),
      releaseColor: jest.fn(),
      getAvailableColors: jest.fn(),
      getPalette: jest.fn(),
    } as unknown as ColorPool;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateList,
        {
          provide: ListsRepository,
          useValue: repository,
        },
        {
          provide: ColorPool,
          useValue: colorPool,
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

  it('should create a new list with auto-assigned color', async () => {
    const userId = 'test-user-1';
    const createListDto: CreateListDto = {
      name: 'New List',
    };
    const now = new Date();
    const assignedColor = '#3B82F6';

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(5);
    jest.spyOn(repository, 'findMaxOrderIndex').mockResolvedValue(3.0);
    jest.spyOn(colorPool, 'getNextColor').mockReturnValue(Color.of(assignedColor));

    const createdList = {
      id: 'new-list-id',
      name: 'New List',
      orderIndex: 4.0,
      isBacklog: false,
      isDone: false,
      color: assignedColor,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'create').mockResolvedValue(createdList);

    const result = await useCase.execute(userId, createListDto);

    expect(repository.countByUserId).toHaveBeenCalledWith(userId, false);
    expect(colorPool.getNextColor).toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith({
      name: 'New List',
      isBacklog: false,
      color: assignedColor,
      userId,
      orderIndex: 4.0,
      isDone: false,
    });
    expect(result).toEqual(createdList);
  });

  it('should create a backlog list with specific color', async () => {
    const userId = 'test-user-1';
    const createListDto: CreateListDto = {
      name: 'Backlog',
      isBacklog: true,
      color: '#3B82F6',
    };
    const now = new Date();

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(2);
    jest.spyOn(repository, 'findMaxOrderIndex').mockResolvedValue(1.0);
    jest.spyOn(colorPool, 'markColorAsUsed').mockImplementation(() => {});

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

    expect(colorPool.markColorAsUsed).toHaveBeenCalledWith(Color.of('#3B82F6'));
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

    await expect(useCase.execute(userId, createListDto)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(userId, createListDto)).rejects.toThrow(
      'Cannot create list - maximum of 10 non-Done lists reached',
    );

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should set orderIndex to 1 for first list', async () => {
    const userId = 'new-user';
    const createListDto: CreateListDto = {
      name: 'First List',
    };
    const now = new Date();
    const assignedColor = '#EF4444';

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(0);
    jest.spyOn(repository, 'findMaxOrderIndex').mockResolvedValue(null);
    jest.spyOn(colorPool, 'getNextColor').mockReturnValue(Color.of(assignedColor));

    const createdList = {
      id: 'first-list-id',
      name: 'First List',
      orderIndex: 1.0,
      isBacklog: false,
      isDone: false,
      color: assignedColor,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'create').mockResolvedValue(createdList);

    const result = await useCase.execute(userId, createListDto);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderIndex: 1.0,
        color: assignedColor,
      }),
    );
    expect(result.orderIndex).toBe(1.0);
  });

  it('should throw BadRequestException when no colors available', async () => {
    const userId = 'test-user-1';
    const createListDto: CreateListDto = {
      name: 'No Color List',
    };

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(5);
    jest.spyOn(repository, 'findMaxOrderIndex').mockResolvedValue(3.0);
    jest.spyOn(colorPool, 'getNextColor').mockImplementation(() => {
      throw new Error('No colors available in pool');
    });

    await expect(useCase.execute(userId, createListDto)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(userId, createListDto)).rejects.toThrow(
      'No colors available in pool',
    );

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when specific color is already used', async () => {
    const userId = 'test-user-1';
    const createListDto: CreateListDto = {
      name: 'Duplicate Color List',
      color: '#3B82F6',
    };

    jest.spyOn(repository, 'countByUserId').mockResolvedValue(2);
    jest.spyOn(repository, 'findMaxOrderIndex').mockResolvedValue(1.0);
    jest.spyOn(colorPool, 'markColorAsUsed').mockImplementation(() => {
      throw new Error('Color #3B82F6 is already in use');
    });

    await expect(useCase.execute(userId, createListDto)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(userId, createListDto)).rejects.toThrow(
      'Color #3B82F6 is already in use',
    );

    expect(repository.create).not.toHaveBeenCalled();
  });
});
