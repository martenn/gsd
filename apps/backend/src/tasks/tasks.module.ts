import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TasksController } from './adapters/tasks.controller';
import { CreateTask } from './use-cases/create-task';
import { GetTasks } from './use-cases/get-tasks';
import { UpdateTask } from './use-cases/update-task';
import { DeleteTask } from './use-cases/delete-task';
import { TasksRepository } from './infra/tasks.repository';
import { ListsModule } from '../lists/lists.module';

@Module({
  imports: [ListsModule],
  controllers: [TasksController],
  providers: [
    CreateTask,
    GetTasks,
    UpdateTask,
    DeleteTask,
    TasksRepository,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [CreateTask, GetTasks, UpdateTask, DeleteTask, TasksRepository],
})
export class TasksModule {}
