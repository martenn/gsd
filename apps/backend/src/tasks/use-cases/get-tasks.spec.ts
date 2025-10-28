import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetTasks } from './get-tasks';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { GetTasksQueryDto } from '../dto/get-tasks-query.dto';

describe('GetTasks', () => {
  let getTasks: GetTasks;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let listsRepository: jest.Mocked<ListsRepository>;

  const userId = 'user-123';
  const listId = 'list-456';

  beforeEach(() => {
    tasksRepository = {
      findManyByList: jest.fn(),
      countByList: jest.fn(),
    } as any;

    listsRepository = {
      findById: jest.fn(),
    } as any;

    getTasks = new GetTasks(tasksRepository, listsRepository);
  });

  describe('execute', () => {
    const mockList = {
      id: listId,
      userId,
      name: 'Test List',
      isDone: false,
      isBacklog: true,
      orderIndex: 1,
      color: '#3B82F6',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTasks = [
      {
        id: 'task-1',
        userId,
        listId,
        title: 'Task 1',
        description: 'Description 1',
        orderIndex: 2000,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-2',
        userId,
        listId,
        title: 'Task 2',
        description: null,
        orderIndex: 1000,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should get tasks for a specific list', async () => {
      const query: GetTasksQueryDto = { listId };

      listsRepository.findById.mockResolvedValue(mockList);
      tasksRepository.findManyByList.mockResolvedValue(mockTasks);
      tasksRepository.countByList.mockResolvedValue(2);

      const result = await getTasks.execute(userId, query);

      expect(result).toEqual({
        tasks: [
          expect.objectContaining({
            id: 'task-1',
            title: 'Task 1',
            description: 'Description 1',
            isCompleted: false,
          }),
          expect.objectContaining({
            id: 'task-2',
            title: 'Task 2',
            description: null,
            isCompleted: false,
          }),
        ],
        total: 2,
        limit: 100,
        offset: 0,
      });

      expect(tasksRepository.findManyByList).toHaveBeenCalledWith(userId, listId, {
        limit: 100,
        offset: 0,
        includeCompleted: false,
      });
    });

    it('should apply custom limit and offset', async () => {
      const query: GetTasksQueryDto = { listId, limit: 20, offset: 10 };

      listsRepository.findById.mockResolvedValue(mockList);
      tasksRepository.findManyByList.mockResolvedValue(mockTasks);
      tasksRepository.countByList.mockResolvedValue(50);

      const result = await getTasks.execute(userId, query);

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(10);
      expect(result.total).toBe(50);

      expect(tasksRepository.findManyByList).toHaveBeenCalledWith(userId, listId, {
        limit: 20,
        offset: 10,
        includeCompleted: false,
      });
    });

    it('should include completed tasks when requested', async () => {
      const query: GetTasksQueryDto = { listId, includeCompleted: true };

      listsRepository.findById.mockResolvedValue(mockList);
      tasksRepository.findManyByList.mockResolvedValue(mockTasks);
      tasksRepository.countByList.mockResolvedValue(2);

      await getTasks.execute(userId, query);

      expect(tasksRepository.findManyByList).toHaveBeenCalledWith(userId, listId, {
        limit: 100,
        offset: 0,
        includeCompleted: true,
      });
    });

    it('should return empty array when no listId provided', async () => {
      const query: GetTasksQueryDto = {};

      const result = await getTasks.execute(userId, query);

      expect(result).toEqual({
        tasks: [],
        total: 0,
        limit: 100,
        offset: 0,
      });

      expect(listsRepository.findById).not.toHaveBeenCalled();
      expect(tasksRepository.findManyByList).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when list does not exist', async () => {
      const query: GetTasksQueryDto = { listId };

      listsRepository.findById.mockResolvedValue(null);

      await expect(getTasks.execute(userId, query)).rejects.toThrow(
        new NotFoundException(`List with id ${listId} not found`),
      );

      expect(tasksRepository.findManyByList).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own list', async () => {
      const query: GetTasksQueryDto = { listId };

      listsRepository.findById.mockResolvedValue({
        ...mockList,
        userId: 'different-user',
      });

      await expect(getTasks.execute(userId, query)).rejects.toThrow(
        new ForbiddenException("You don't have permission to access this list"),
      );

      expect(tasksRepository.findManyByList).not.toHaveBeenCalled();
    });
  });
});
