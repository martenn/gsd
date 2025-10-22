import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for local development
  app.enableCors({
    origin: 'http://localhost:4321',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
