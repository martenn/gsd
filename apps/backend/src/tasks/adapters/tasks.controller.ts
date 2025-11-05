import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateTaskResponseDto,
  GetTasksResponseDto,
  UpdateTaskResponseDto,
  MoveTaskResponseDto,
  CompleteTaskResponseDto,
  ReorderTaskResponseDto,
} from '@gsd/types';
import { CreateTask } from '../use-cases/create-task';
import { GetTasks } from '../use-cases/get-tasks';
import { UpdateTask } from '../use-cases/update-task';
import { DeleteTask } from '../use-cases/delete-task';
import { MoveTask } from '../use-cases/move-task';
import { CompleteTask } from '../use-cases/complete-task';
import { ReorderTask } from '../use-cases/reorder-task';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { GetTasksQueryDto } from '../dto/get-tasks-query.dto';
import { MoveTaskDto } from '../dto/move-task.dto';
import { ReorderTaskDto } from '../dto/reorder-task.dto';

@Controller('v1/tasks')
export class TasksController {
  constructor(
    private readonly createTaskUseCase: CreateTask,
    private readonly getTasksUseCase: GetTasks,
    private readonly updateTaskUseCase: UpdateTask,
    private readonly deleteTaskUseCase: DeleteTask,
    private readonly moveTaskUseCase: MoveTask,
    private readonly completeTaskUseCase: CompleteTask,
    private readonly reorderTaskUseCase: ReorderTask,
  ) {}

  @Get()
  async getTasks(@Query() query: GetTasksQueryDto): Promise<GetTasksResponseDto> {
    const userId = 'mock-user-id';
    return this.getTasksUseCase.execute(userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() createTaskDto: CreateTaskDto): Promise<CreateTaskResponseDto> {
    const userId = 'mock-user-id';
    const task = await this.createTaskUseCase.execute(userId, createTaskDto);
    return { task };
  }

  @Patch(':id')
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<UpdateTaskResponseDto> {
    const userId = 'mock-user-id';
    const task = await this.updateTaskUseCase.execute(userId, id, updateTaskDto);
    return { task };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('id') id: string): Promise<void> {
    const userId = 'mock-user-id';
    await this.deleteTaskUseCase.execute(userId, id);
  }

  @Post(':id/move')
  async moveTask(
    @Param('id') taskId: string,
    @Body() dto: MoveTaskDto,
  ): Promise<MoveTaskResponseDto> {
    const userId = 'mock-user-id';
    const task = await this.moveTaskUseCase.execute(userId, taskId, dto.listId);
    return { task };
  }

  @Post(':id/complete')
  async completeTask(@Param('id') taskId: string): Promise<CompleteTaskResponseDto> {
    const userId = 'mock-user-id';
    const task = await this.completeTaskUseCase.execute(userId, taskId);
    return { task };
  }

  @Post(':id/reorder')
  async reorderTask(
    @Param('id') taskId: string,
    @Body() dto: ReorderTaskDto,
  ): Promise<ReorderTaskResponseDto> {
    const userId = 'mock-user-id';
    const task = await this.reorderTaskUseCase.execute(userId, taskId, dto);
    return { task };
  }
}
