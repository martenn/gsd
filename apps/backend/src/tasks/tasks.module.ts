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
import { ListsModule } from '../lists/lists.module';

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
  ],
})
export class TasksModule {}
