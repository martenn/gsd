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
import { CreateTaskResponseDto, GetTasksResponseDto, UpdateTaskResponseDto } from '@gsd/types';
import { CreateTask } from '../use-cases/create-task';
import { GetTasks } from '../use-cases/get-tasks';
import { UpdateTask } from '../use-cases/update-task';
import { DeleteTask } from '../use-cases/delete-task';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { GetTasksQueryDto } from '../dto/get-tasks-query.dto';

@Controller('v1/tasks')
export class TasksController {
  constructor(
    private readonly createTaskUseCase: CreateTask,
    private readonly getTasksUseCase: GetTasks,
    private readonly updateTaskUseCase: UpdateTask,
    private readonly deleteTaskUseCase: DeleteTask,
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
}
