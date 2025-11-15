import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
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

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  const logger = new AppLogger();
  const requestIdMiddleware = new RequestIdMiddleware();

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
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
