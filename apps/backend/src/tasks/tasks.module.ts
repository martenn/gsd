import { Module } from '@nestjs/common';
import { TasksController } from './adapters/tasks.controller';
import { CreateTask } from './use-cases/create-task';
import { GetTasks } from './use-cases/get-tasks';
import { UpdateTask } from './use-cases/update-task';
import { DeleteTask } from './use-cases/delete-task';
import { MoveTask } from './use-cases/move-task';
import { CompleteTask } from './use-cases/complete-task';
import { ReorderTask } from './use-cases/reorder-task';
import { TasksRepository } from './infra/tasks.repository';
import { TaskMapper } from './mappers/task.mapper';
import { ListsModule } from '../lists/lists.module';
import { AppLogger } from '../logger/app-logger';

@Module({
  imports: [ListsModule],
  controllers: [TasksController],
  providers: [
    CreateTask,
    GetTasks,
    UpdateTask,
    DeleteTask,
    MoveTask,
    CompleteTask,
    ReorderTask,
    TasksRepository,
    TaskMapper,
    AppLogger,
  ],
  exports: [
    CreateTask,
    GetTasks,
    UpdateTask,
    DeleteTask,
    MoveTask,
    CompleteTask,
    ReorderTask,
    TasksRepository,
    TaskMapper,
  ],
})
export class TasksModule {}
