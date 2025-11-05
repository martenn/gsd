import { Test, TestingModule } from '@nestjs/testing';
import { GetLists } from './get-lists';
import { ListsRepository } from '../infra/lists.repository';
import { AppLogger } from '../../logger/app-logger';

describe('GetLists', () => {
  let useCase: GetLists;
  let repository: ListsRepository;

  beforeEach(async () => {
    repository = {
      findManyByUserId: jest.fn(),
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
        GetLists,
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

    useCase = module.get<GetLists>(GetLists);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when user has no lists', async () => {
    const userId = 'test-user-1';

    jest.spyOn(repository, 'findManyByUserId').mockResolvedValue([]);

    const result = await useCase.execute(userId);

    expect(result).toEqual([]);
    expect(repository.findManyByUserId).toHaveBeenCalledWith(userId, false);
  });

  it('should return all non-Done lists ordered by orderIndex', async () => {
    const userId = 'test-user-1';
    const now = new Date();

    const mockLists = [
      {
        id: 'list-1',
        name: 'Backlog',
        orderIndex: 1.0,
        isBacklog: true,
        isDone: false,
        color: '#3B82F6',
        userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'list-3',
        name: 'This Week',
        orderIndex: 1.5,
        isBacklog: false,
        isDone: false,
        color: null,
        userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'list-2',
        name: 'Today',
        orderIndex: 2.0,
        isBacklog: false,
        isDone: false,
        color: null,
        userId,
        createdAt: now,
        updatedAt: now,
      },
    ];

    jest.spyOn(repository, 'findManyByUserId').mockResolvedValue(mockLists);

    const result = await useCase.execute(userId);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Backlog');
    expect(result[1].name).toBe('This Week');
    expect(result[2].name).toBe('Today');
  });

  it('should call repository with correct parameters', async () => {
    const userId = 'test-user-2';

    jest.spyOn(repository, 'findManyByUserId').mockResolvedValue([]);

    await useCase.execute(userId);

    expect(repository.findManyByUserId).toHaveBeenCalledWith(userId, false);
  });

  it('should correctly map Prisma list model to DTO', async () => {
    const userId = 'test-user-3';
    const now = new Date();

    const mockList = {
      id: 'list-id',
      name: 'Test List',
      orderIndex: 1.0,
      isBacklog: true,
      isDone: false,
      color: '#FF0000',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    jest.spyOn(repository, 'findManyByUserId').mockResolvedValue([mockList]);

    const result = await useCase.execute(userId);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: mockList.id,
      name: mockList.name,
      orderIndex: mockList.orderIndex,
      isBacklog: mockList.isBacklog,
      isDone: mockList.isDone,
      color: mockList.color,
      userId: mockList.userId,
      createdAt: mockList.createdAt,
      updatedAt: mockList.updatedAt,
    });
  });
});
