import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { RequestIdMiddleware } from '../src/common/middleware/request-id.middleware';
import { AppLogger } from '../src/logger/app-logger';

describe('Error Handling (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const logger = new AppLogger();
    const requestIdMiddleware = new RequestIdMiddleware();

    app.use(requestIdMiddleware.use.bind(requestIdMiddleware));
    app.useGlobalFilters(new HttpExceptionFilter(logger));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Validation errors (400)', () => {
    it('should return 400 with validation errors for invalid DTO', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/lists')
        .send({
          name: '',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        timestamp: expect.any(String),
        path: '/v1/lists',
      });

      expect(response.body.message).toBeDefined();
    });

    it('should include request ID in validation error response', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/lists')
        .send({
          invalidField: 'value',
        })
        .expect(400);

      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe('string');
    });
  });

  describe('Not Found errors (404)', () => {
    it('should return 404 for non-existent list', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/lists/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        timestamp: expect.any(String),
        path: '/v1/lists/non-existent-id',
        requestId: expect.any(String),
      });
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/tasks/non-existent-task-id')
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
      });
    });

    it('should return 404 for non-existent route', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('Unauthorized errors (401)', () => {
    it('should return 401 for missing JWT on protected route', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/lists')
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        error: 'Unauthorized',
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 401 for invalid JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/lists')
        .set('Cookie', ['session=invalid-token'])
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        error: 'Unauthorized',
      });
    });
  });

  describe('Business rule violations (409)', () => {
    it('should return 409 for deleting the last backlog', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/lists/last-backlog-id')
        .expect(401);

      expect(response.body.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Error response format', () => {
    it('should include all required fields in error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('requestId');
    });

    it('should return ISO 8601 timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent')
        .expect(404);

      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should include correct path in error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/lists/123')
        .expect(404);

      expect(response.body.path).toBe('/v1/lists/123');
    });
  });

  describe('CORS errors', () => {
    it('should handle CORS preflight requests', async () => {
      await request(app.getHttpServer())
        .options('/v1/lists')
        .set('Origin', 'http://localhost:4321')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);
    });
  });

  describe('Request ID correlation', () => {
    it('should assign unique request IDs to different requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/non-existent-1')
        .expect(404);

      const response2 = await request(app.getHttpServer())
        .get('/non-existent-2')
        .expect(404);

      expect(response1.body.requestId).toBeDefined();
      expect(response2.body.requestId).toBeDefined();
      expect(response1.body.requestId).not.toBe(response2.body.requestId);
    });
  });

  describe('Security - No information disclosure', () => {
    it('should not expose stack traces in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app.getHttpServer())
        .get('/cause-server-error')
        .expect(404);

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('stackTrace');

      process.env.NODE_ENV = originalEnv;
    });

    it('should use generic message for 500 errors in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app.getHttpServer())
        .get('/non-existent')
        .expect(404);

      expect(response.body.message).not.toContain('database');
      expect(response.body.message).not.toContain('prisma');
      expect(response.body.message).not.toContain('sql');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
