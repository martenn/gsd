import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let jwtService: JwtService;

  const testUser = {
    id: 'test-user-auth-id',
    email: 'test@example.com',
    googleId: 'google-123',
    name: 'Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Clean up existing test data
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });

    // Create test user
    await prisma.user.create({
      data: testUser,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });

    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /auth/me', () => {
    it('should return user data with valid JWT', async () => {
      const token = jwtService.sign({ sub: testUser.id, email: testUser.email });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `jwt=${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
      });
    });

    it('should return 401 when JWT is missing', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return 401 when JWT is invalid', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', 'jwt=invalid-token')
        .expect(401);
    });

    it('should return 401 when JWT is expired', async () => {
      const expiredToken = jwtService.sign(
        { sub: testUser.id, email: testUser.email },
        { expiresIn: '0s' },
      );

      // Wait a moment to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `jwt=${expiredToken}`)
        .expect(401);
    });
  });

  describe('POST /auth/signout', () => {
    it('should clear JWT cookie and return success', async () => {
      const token = jwtService.sign({ sub: testUser.id, email: testUser.email });

      const response = await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Cookie', `jwt=${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Signed out successfully',
      });

      // Verify cookie is cleared
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader[0]).toContain('jwt=;');
      expect(setCookieHeader[0]).toContain('Max-Age=0');
    });

    it('should return 401 when JWT is missing', async () => {
      await request(app.getHttpServer()).post('/auth/signout').expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should protect /v1/lists endpoint', async () => {
      await request(app.getHttpServer()).get('/v1/lists').expect(401);
    });

    it('should protect /v1/tasks endpoint', async () => {
      await request(app.getHttpServer()).get('/v1/tasks').expect(401);
    });

    it('should protect /v1/done endpoint', async () => {
      await request(app.getHttpServer()).get('/v1/done').expect(401);
    });

    it('should protect /v1/metrics/daily endpoint', async () => {
      await request(app.getHttpServer()).get('/v1/metrics/daily').expect(401);
    });

    it('should allow access to protected routes with valid JWT', async () => {
      const token = jwtService.sign({ sub: testUser.id, email: testUser.email });

      // Create a test list so the lists endpoint returns data
      const list = await prisma.list.create({
        data: {
          userId: testUser.id,
          name: 'Test List',
          orderIndex: 1,
          isBacklog: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/lists')
        .set('Cookie', `jwt=${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('lists');
      expect(Array.isArray(response.body.lists)).toBe(true);

      // Clean up
      await prisma.list.delete({ where: { id: list.id } });
    });
  });

  describe('OAuth Flow', () => {
    it('should initiate Google OAuth flow', async () => {
      const response = await request(app.getHttpServer()).get('/auth/google').expect(302);

      // Should redirect to Google OAuth
      expect(response.headers.location).toContain('accounts.google.com');
    });

    // Note: Full OAuth callback flow testing requires mocking Google's response
    // which is complex for E2E tests. The callback logic is covered by unit tests.
  });
});
