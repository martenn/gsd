import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListsModule } from './lists/lists.module';
import { TasksModule } from './tasks/tasks.module';
import { LoggerModule } from './logger/logger.module';
import { HttpLoggingInterceptor } from './logger/http-logging.interceptor';

@Module({
  imports: [LoggerModule, ListsModule, TasksModule],
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
