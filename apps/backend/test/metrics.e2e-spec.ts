import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('MetricsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.list.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'metrics-test@example.com',
        googleId: 'google-metrics-123',
      },
    });
    userId = user.id;

    authToken = 'mock-jwt-token';
  });

  describe('GET /v1/metrics/daily', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/v1/metrics/daily').expect(401);
    });

    it('should return daily metrics with default parameters', async () => {
      const doneList = await prisma.list.create({
        data: {
          name: 'Done',
          orderIndex: 1000,
          userId,
          isBacklog: false,
          isDone: true,
        },
      });

      await prisma.task.createMany({
        data: [
          {
            title: 'Task 1',
            orderIndex: 1000,
            listId: doneList.id,
            userId,
            completedAt: new Date('2025-01-15T10:00:00Z'),
          },
          {
            title: 'Task 2',
            orderIndex: 2000,
            listId: doneList.id,
            userId,
            completedAt: new Date('2025-01-15T14:00:00Z'),
          },
          {
            title: 'Task 3',
            orderIndex: 3000,
            listId: doneList.id,
            userId,
            completedAt: new Date('2025-01-16T08:00:00Z'),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/v1/metrics/daily')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
      expect(response.body).toHaveProperty('timezone');
      expect(response.body).toHaveProperty('totalCompleted');
      expect(Array.isArray(response.body.metrics)).toBe(true);
    });

    it('should respect timezone parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/daily?timezone=America/New_York')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.timezone).toBe('America/New_York');
    });

    it('should respect custom date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/daily?startDate=2025-01-01&endDate=2025-01-05')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.startDate).toBe('2025-01-01');
      expect(response.body.endDate).toBe('2025-01-05');
      expect(response.body.metrics.length).toBe(5);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/daily?startDate=invalid-date')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);

      expect(response.body.message).toContain('startDate');
    });

    it('should return 400 for invalid timezone format', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/daily?timezone=InvalidTimezone')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);

      expect(response.body.message).toContain('timezone');
    });

    it('should return 400 when end date before start date', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/daily?startDate=2025-01-10&endDate=2025-01-01')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);

      expect(response.body.message).toContain('End date must be after start date');
    });

    it('should return 400 when date range exceeds 1 year', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/daily?startDate=2024-01-01&endDate=2025-01-02')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);

      expect(response.body.message).toContain('Date range cannot exceed 1 year');
    });
  });

  describe('GET /v1/metrics/weekly', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/v1/metrics/weekly').expect(401);
    });

    it('should return weekly metrics with default parameters', async () => {
      const doneList = await prisma.list.create({
        data: {
          name: 'Done',
          orderIndex: 1000,
          userId,
          isBacklog: false,
          isDone: true,
        },
      });

      await prisma.task.createMany({
        data: [
          {
            title: 'Task 1',
            orderIndex: 1000,
            listId: doneList.id,
            userId,
            completedAt: new Date('2025-01-06T10:00:00Z'),
          },
          {
            title: 'Task 2',
            orderIndex: 2000,
            listId: doneList.id,
            userId,
            completedAt: new Date('2025-01-13T14:00:00Z'),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/v1/metrics/weekly')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
      expect(response.body).toHaveProperty('timezone');
      expect(response.body).toHaveProperty('totalCompleted');
      expect(response.body).toHaveProperty('totalWeeks');
      expect(Array.isArray(response.body.metrics)).toBe(true);
    });

    it('should respect timezone parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/weekly?timezone=America/Los_Angeles')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.timezone).toBe('America/Los_Angeles');
    });

    it('should respect custom date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/weekly?startDate=2025-01-06&endDate=2025-01-19')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.startDate).toBe('2025-01-06');
      expect(response.body.endDate).toBe('2025-01-19');
    });

    it('should return weekly metrics with Monday-Sunday weeks', async () => {
      const doneList = await prisma.list.create({
        data: {
          name: 'Done',
          orderIndex: 1000,
          userId,
          isBacklog: false,
          isDone: true,
        },
      });

      await prisma.task.create({
        data: {
          title: 'Task 1',
          orderIndex: 1000,
          listId: doneList.id,
          userId,
          completedAt: new Date('2025-01-06T10:00:00Z'),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/metrics/weekly?startDate=2025-01-06&endDate=2025-01-12')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.metrics[0]).toHaveProperty('weekStartDate');
      expect(response.body.metrics[0]).toHaveProperty('weekEndDate');
      expect(response.body.metrics[0]).toHaveProperty('count');
      expect(response.body.metrics[0]).toHaveProperty('timezone');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/weekly?endDate=not-a-date')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);

      expect(response.body.message).toContain('endDate');
    });

    it('should return 400 when end date before start date', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/metrics/weekly?startDate=2025-01-20&endDate=2025-01-01')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);

      expect(response.body.message).toContain('End date must be after start date');
    });
  });
});
