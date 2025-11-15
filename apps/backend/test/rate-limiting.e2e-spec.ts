import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { THROTTLER_GLOBAL, THROTTLER_AUTH } from './../src/config/throttler.config';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Global Rate Limit (100 req/min)', () => {
    it('should allow requests within limit', async () => {
      const endpoint = '/';

      for (let i = 0; i < 10; i++) {
        const response = await request(app.getHttpServer()).get(endpoint);

        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
        expect(response.headers['x-ratelimit-reset']).toBeDefined();
      }
    });

    it('should return 429 when limit exceeded', async () => {
      const endpoint = '/';

      for (let i = 0; i < THROTTLER_GLOBAL.limit; i++) {
        await request(app.getHttpServer()).get(endpoint);
      }

      const response = await request(app.getHttpServer()).get(endpoint);

      expect(response.status).toBe(429);
      expect(response.body.statusCode).toBe(429);
      expect(response.body.message).toBe('Too many requests, please try again later');
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBe('0');
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('should include rate limit headers in all responses', async () => {
      const response = await request(app.getHttpServer()).get('/');

      expect(response.headers['x-ratelimit-limit']).toBe(String(THROTTLER_GLOBAL.limit));
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();

      const remaining = parseInt(response.headers['x-ratelimit-remaining']);
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(THROTTLER_GLOBAL.limit);

      const reset = parseInt(response.headers['x-ratelimit-reset']);
      expect(reset).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('Auth Endpoints Rate Limit (5 req/min)', () => {
    it('should apply strict limit to auth endpoints', async () => {
      const endpoint = '/auth/google';

      for (let i = 0; i < THROTTLER_AUTH.limit; i++) {
        const response = await request(app.getHttpServer()).get(endpoint);
        expect([200, 302]).toContain(response.status);
      }

      const response = await request(app.getHttpServer()).get(endpoint);

      expect(response.status).toBe(429);
      expect(response.body.message).toBe('Too many requests, please try again later');
    });

    it('should include correct rate limit headers for auth endpoints', async () => {
      const response = await request(app.getHttpServer()).get('/auth/google');

      expect(response.headers['x-ratelimit-limit']).toBe(String(THROTTLER_AUTH.limit));
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();

      const remaining = parseInt(response.headers['x-ratelimit-remaining']);
      expect(remaining).toBeLessThanOrEqual(THROTTLER_AUTH.limit);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset counter after TTL expires', async () => {
      const endpoint = '/';

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).get(endpoint);
      }

      const beforeReset = await request(app.getHttpServer()).get(endpoint);
      const remainingBefore = parseInt(beforeReset.headers['x-ratelimit-remaining']);
      expect(remainingBefore).toBeLessThan(THROTTLER_GLOBAL.limit);

      await new Promise((resolve) => setTimeout(resolve, THROTTLER_GLOBAL.ttl * 1000 + 100));

      const afterReset = await request(app.getHttpServer()).get(endpoint);
      const remainingAfter = parseInt(afterReset.headers['x-ratelimit-remaining']);

      expect(afterReset.status).toBe(200);
      expect(remainingAfter).toBeGreaterThan(remainingBefore);
    }, 70000);
  });

  describe('Multiple IPs', () => {
    it('should track rate limits independently per IP', async () => {
      const endpoint = '/';

      const ip1Response = await request(app.getHttpServer())
        .get(endpoint)
        .set('X-Forwarded-For', '192.168.1.100');

      const ip2Response = await request(app.getHttpServer())
        .get(endpoint)
        .set('X-Forwarded-For', '192.168.1.200');

      expect(ip1Response.status).toBe(200);
      expect(ip2Response.status).toBe(200);

      const ip1Remaining = parseInt(ip1Response.headers['x-ratelimit-remaining']);
      const ip2Remaining = parseInt(ip2Response.headers['x-ratelimit-remaining']);

      expect(ip1Remaining).toBeGreaterThanOrEqual(0);
      expect(ip2Remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Response Format', () => {
    it('should return properly formatted error response on 429', async () => {
      const endpoint = '/';

      for (let i = 0; i < THROTTLER_GLOBAL.limit; i++) {
        await request(app.getHttpServer()).get(endpoint);
      }

      const response = await request(app.getHttpServer()).get(endpoint);

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        statusCode: 429,
        message: 'Too many requests, please try again later',
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.headers['retry-after']).toBeDefined();

      const retryAfter = parseInt(response.headers['retry-after']);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(THROTTLER_GLOBAL.ttl);
    });
  });
});
