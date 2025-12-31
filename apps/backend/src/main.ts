import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Express } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getLoggerConfig } from './logger/logger.config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './logger/app-logger';

async function bootstrap() {
  const loggerConfig = getLoggerConfig();

  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig.logLevels,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Enable trust proxy for production environments behind load balancers
    const httpAdapter = app.getHttpAdapter();
    if (httpAdapter instanceof ExpressAdapter) {
      const expressApp = httpAdapter.getInstance<Express>();
      expressApp.set('trust proxy', 1);
    }
  }

  const logger = new AppLogger();
  const requestIdMiddleware = new RequestIdMiddleware();

  // Security headers with Helmet
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // Referrer-Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  app.use(requestIdMiddleware.use.bind(requestIdMiddleware));
  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter(logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 hours
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
