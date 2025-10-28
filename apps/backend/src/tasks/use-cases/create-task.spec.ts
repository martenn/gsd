import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateTask } from './create-task';
import { TasksRepository } from '../infra/tasks.repository';
import { ListsRepository } from '../../lists/infra/lists.repository';
import { CreateTaskDto } from '../dto/create-task.dto';

describe('CreateTask', () => {
  let createTask: CreateTask;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let listsRepository: jest.Mocked<ListsRepository>;

  const userId = 'user-123';
  const listId = 'list-456';
  const taskId = 'task-789';

  beforeEach(() => {
    tasksRepository = {
      create: jest.fn(),
      countByList: jest.fn(),
      findMaxOrderIndex: jest.fn(),
    } as any;

    listsRepository = {
      findById: jest.fn(),
    } as any;

    createTask = new CreateTask(tasksRepository, listsRepository);
  });

  describe('execute', () => {
    const validDto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test Description',
      listId,
    };

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

    const mockTask = {
      id: taskId,
      userId,
      listId,
      title: 'Test Task',
      description: 'Test Description',
      orderIndex: 2000,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create task successfully', async () => {
      listsRepository.findById.mockResolvedValue(mockList);
      tasksRepository.countByList.mockResolvedValue(5);
      tasksRepository.findMaxOrderIndex.mockResolvedValue(1000);
      tasksRepository.create.mockResolvedValue(mockTask);

      const result = await createTask.execute(userId, validDto);

      expect(result).toMatchObject({
        id: taskId,
        title: 'Test Task',
        description: 'Test Description',
        orderIndex: 2000,
        isCompleted: false,
      });

      expect(tasksRepository.create).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test Description',
        listId,
        userId,
        orderIndex: 2000,
      });
    });

    it('should create task with initial order index when list is empty', async () => {
      listsRepository.findById.mockResolvedValue(mockList);
      tasksRepository.countByList.mockResolvedValue(0);
      tasksRepository.findMaxOrderIndex.mockResolvedValue(null);
      tasksRepository.create.mockResolvedValue({ ...mockTask, orderIndex: 1000 });

      await createTask.execute(userId, validDto);

      expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderIndex: 1000,
        }),
      );
    });

    it('should throw NotFoundException when list does not exist', async () => {
      listsRepository.findById.mockResolvedValue(null);

      await expect(createTask.execute(userId, validDto)).rejects.toThrow(
        new NotFoundException(`List with id ${listId} not found`),
      );

      expect(tasksRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own list', async () => {
      listsRepository.findById.mockResolvedValue({
        ...mockList,
        userId: 'different-user',
      });

      await expect(createTask.execute(userId, validDto)).rejects.toThrow(
        new ForbiddenException("You don't have permission to access this list"),
      );

      expect(tasksRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when list is Done list', async () => {
      listsRepository.findById.mockResolvedValue({
        ...mockList,
        isDone: true,
      });

      await expect(createTask.execute(userId, validDto)).rejects.toThrow(
        new BadRequestException('Cannot create tasks in Done list directly'),
      );

      expect(tasksRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when list has reached capacity', async () => {
      listsRepository.findById.mockResolvedValue(mockList);
      tasksRepository.countByList.mockResolvedValue(100);

      await expect(createTask.execute(userId, validDto)).rejects.toThrow(
        new BadRequestException('List has reached maximum task limit (100)'),
      );

      expect(tasksRepository.create).not.toHaveBeenCalled();
    });

    it('should handle task without description', async () => {
      const dtoWithoutDescription: CreateTaskDto = {
        title: 'Test Task',
        listId,
      };

      listsRepository.findById.mockResolvedValue(mockList);
      tasksRepository.countByList.mockResolvedValue(0);
      tasksRepository.findMaxOrderIndex.mockResolvedValue(null);
      tasksRepository.create.mockResolvedValue({
        ...mockTask,
        description: null,
      });

      const result = await createTask.execute(userId, dtoWithoutDescription);

      expect(result.description).toBeNull();
      expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        }),
      );
    });
  });
});
