import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListsModule } from './lists/lists.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [ListsModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
