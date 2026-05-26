import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MoveAllTasks } from './move-all-tasks';
import { ListsRepository } from '../infra/lists.repository';
import { TasksRepository } from '../../tasks/infra/tasks.repository';
import { AppLogger } from '../../logger/app-logger';

describe('MoveAllTasks', () => {
  let moveAllTasks: MoveAllTasks;
  let listsRepository: jest.Mocked<ListsRepository>;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let logger: jest.Mocked<AppLogger>;

  const userId = 'user-123';
  const sourceListId = 'list-source';
  const destinationListId = 'list-dest';

  const baseList = {
    userId,
    name: 'List',
    orderIndex: 1,
    isBacklog: false,
    isDone: false,
    color: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    listsRepository = {
      findById: jest.fn(),
    } as any;

    tasksRepository = {
      countByList: jest.fn(),
      moveAllNonCompletedTasks: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as any;

    moveAllTasks = new MoveAllTasks(listsRepository, tasksRepository, logger);
  });

  it('rejects when source and destination are the same list', async () => {
    await expect(moveAllTasks.execute(userId, sourceListId, sourceListId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException when source list is missing', async () => {
    listsRepository.findById.mockImplementation((id) =>
      Promise.resolve(id === sourceListId ? null : ({ ...baseList, id, isDone: false } as any)),
    );

    await expect(moveAllTasks.execute(userId, sourceListId, destinationListId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when destination list is missing', async () => {
    listsRepository.findById.mockImplementation((id) =>
      Promise.resolve(id === destinationListId ? null : ({ ...baseList, id } as any)),
    );

    await expect(moveAllTasks.execute(userId, sourceListId, destinationListId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects moving out of the Done list', async () => {
    listsRepository.findById.mockImplementation((id) =>
      Promise.resolve(
        id === sourceListId
          ? ({ ...baseList, id, isDone: true } as any)
          : ({ ...baseList, id } as any),
      ),
    );

    await expect(moveAllTasks.execute(userId, sourceListId, destinationListId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects moving into the Done list', async () => {
    listsRepository.findById.mockImplementation((id) =>
      Promise.resolve(
        id === destinationListId
          ? ({ ...baseList, id, isDone: true } as any)
          : ({ ...baseList, id } as any),
      ),
    );

    await expect(moveAllTasks.execute(userId, sourceListId, destinationListId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('short-circuits when source list is empty', async () => {
    listsRepository.findById.mockImplementation((id) =>
      Promise.resolve({ ...baseList, id } as any),
    );
    tasksRepository.countByList.mockResolvedValue(0);

    const result = await moveAllTasks.execute(userId, sourceListId, destinationListId);

    expect(result).toEqual({ movedCount: 0 });
    expect(tasksRepository.moveAllNonCompletedTasks).not.toHaveBeenCalled();
  });

  it('rejects when combined count would exceed 100', async () => {
    listsRepository.findById.mockImplementation((id) =>
      Promise.resolve({ ...baseList, id } as any),
    );
    tasksRepository.countByList.mockImplementation((_user, listId) =>
      Promise.resolve(listId === sourceListId ? 60 : 50),
    );

    await expect(moveAllTasks.execute(userId, sourceListId, destinationListId)).rejects.toThrow(
      BadRequestException,
    );
    expect(tasksRepository.moveAllNonCompletedTasks).not.toHaveBeenCalled();
  });

  it('moves all tasks and returns the moved count when all checks pass', async () => {
    listsRepository.findById.mockImplementation((id) =>
      Promise.resolve({ ...baseList, id } as any),
    );
    tasksRepository.countByList.mockImplementation((_user, listId) =>
      Promise.resolve(listId === sourceListId ? 5 : 3),
    );
    tasksRepository.moveAllNonCompletedTasks.mockResolvedValue(5);

    const result = await moveAllTasks.execute(userId, sourceListId, destinationListId);

    expect(result).toEqual({ movedCount: 5 });
    expect(tasksRepository.moveAllNonCompletedTasks).toHaveBeenCalledWith(
      userId,
      sourceListId,
      destinationListId,
    );
  });
});
