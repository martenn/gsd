import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ListsModule } from './lists/lists.module';
import { TasksModule } from './tasks/tasks.module';
import { DoneModule } from './done/done.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { HttpLoggingInterceptor } from './logger/http-logging.interceptor';
import { THROTTLER_GLOBAL } from './config/throttler.config';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLER_GLOBAL.ttl * 1000,
        limit: THROTTLER_GLOBAL.limit,
      },
    ]),
    LoggerModule,
    AuthModule,
    ListsModule,
    TasksModule,
    DoneModule,
    MaintenanceModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
