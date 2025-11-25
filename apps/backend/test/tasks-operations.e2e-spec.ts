import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('Tasks Operations (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const userId = 'mock-user-id';
  let backlogListId: string;
  let todayListId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();

    // Clean up existing test data
    await prisma.task.deleteMany({
      where: { userId },
    });
    await prisma.list.deleteMany({
      where: { userId },
    });

    // Create test lists
    const backlogList = await prisma.list.create({
      data: {
        userId,
        name: 'Backlog',
        orderIndex: 1,
        isBacklog: true,
        isDone: false,
      },
    });
    backlogListId = backlogList.id;

    const todayList = await prisma.list.create({
      data: {
        userId,
        name: 'Today',
        orderIndex: 2,
        isBacklog: false,
        isDone: false,
      },
    });
    todayListId = todayList.id;

    // Create a test task
    const task = await prisma.task.create({
      data: {
        userId,
        listId: backlogListId,
        originBacklogId: backlogListId,
        title: 'Test Task for Moving',
        description: 'This task will be moved',
        orderIndex: 1000,
      },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.task.deleteMany({
      where: { userId },
    });
    await prisma.list.deleteMany({
      where: { userId },
    });

    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /v1/tasks/:id/move', () => {
    it('should move task from backlog to today list', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/tasks/${taskId}/move`)
        .send({ listId: todayListId })
        .expect(200);

      expect(response.body).toHaveProperty('task');
      expect(response.body.task).toMatchObject({
        id: taskId,
        listId: todayListId,
        title: 'Test Task for Moving',
      });

      // Verify in database
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(task?.listId).toBe(todayListId);
    });

    it('should return 400 when target list is Done list', async () => {
      // Create Done list
      const doneList = await prisma.list.create({
        data: {
          userId,
          name: 'Done',
          orderIndex: 3,
          isBacklog: false,
          isDone: true,
        },
      });

      await request(app.getHttpServer())
        .post(`/v1/tasks/${taskId}/move`)
        .send({ listId: doneList.id })
        .expect(400);

      // Clean up
      await prisma.list.delete({ where: { id: doneList.id } });
    });

    it('should return 404 when task does not exist', async () => {
      const fakeTaskId = 'fake-task-id';

      await request(app.getHttpServer())
        .post(`/v1/tasks/${fakeTaskId}/move`)
        .send({ listId: todayListId })
        .expect(404);
    });

    it('should return 404 when target list does not exist', async () => {
      const fakeListId = 'fake-list-id';

      await request(app.getHttpServer())
        .post(`/v1/tasks/${taskId}/move`)
        .send({ listId: fakeListId })
        .expect(404);
    });

    it('should return 400 when target list is at capacity (100 tasks)', async () => {
      // Create a list and fill it with 100 tasks
      const fullList = await prisma.list.create({
        data: {
          userId,
          name: 'Full List',
          orderIndex: 4,
          isBacklog: false,
          isDone: false,
        },
      });

      // Create 100 tasks in the list
      await prisma.task.createMany({
        data: Array.from({ length: 100 }, (_, i) => ({
          userId,
          listId: fullList.id,
          originBacklogId: backlogListId,
          title: `Task ${i}`,
          orderIndex: (i + 1) * 1000,
        })),
      });

      await request(app.getHttpServer())
        .post(`/v1/tasks/${taskId}/move`)
        .send({ listId: fullList.id })
        .expect(400);

      // Clean up
      await prisma.task.deleteMany({ where: { listId: fullList.id } });
      await prisma.list.delete({ where: { id: fullList.id } });
    });

    it('should return 400 when listId is missing in request body', async () => {
      await request(app.getHttpServer()).post(`/v1/tasks/${taskId}/move`).send({}).expect(400);
    });

    it('should return 400 when listId is invalid UUID format', async () => {
      await request(app.getHttpServer())
        .post(`/v1/tasks/${taskId}/move`)
        .send({ listId: 'invalid-id' })
        .expect(400);
    });
  });
});
