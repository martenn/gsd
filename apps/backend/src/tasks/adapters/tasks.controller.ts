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
  UseGuards,
} from '@nestjs/common';
import {
  CreateTaskResponseDto,
  GetTasksResponseDto,
  UpdateTaskResponseDto,
  MoveTaskResponseDto,
  CompleteTaskResponseDto,
  ReorderTaskResponseDto,
} from '@gsd/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/dto/jwt-user.dto';
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
@UseGuards(JwtAuthGuard)
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
  async getTasks(
    @CurrentUser() user: JwtUser,
    @Query() query: GetTasksQueryDto,
  ): Promise<GetTasksResponseDto> {
    return this.getTasksUseCase.execute(user.id, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @CurrentUser() user: JwtUser,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<CreateTaskResponseDto> {
    const task = await this.createTaskUseCase.execute(user.id, createTaskDto);
    return { task };
  }

  @Patch(':id')
  async updateTask(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<UpdateTaskResponseDto> {
    const task = await this.updateTaskUseCase.execute(user.id, id, updateTaskDto);
    return { task };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@CurrentUser() user: JwtUser, @Param('id') id: string): Promise<void> {
    await this.deleteTaskUseCase.execute(user.id, id);
  }

  @Post(':id/move')
  async moveTask(
    @CurrentUser() user: JwtUser,
    @Param('id') taskId: string,
    @Body() dto: MoveTaskDto,
  ): Promise<MoveTaskResponseDto> {
    const task = await this.moveTaskUseCase.execute(user.id, taskId, dto.listId);
    return { task };
  }

  @Post(':id/complete')
  async completeTask(
    @CurrentUser() user: JwtUser,
    @Param('id') taskId: string,
  ): Promise<CompleteTaskResponseDto> {
    const task = await this.completeTaskUseCase.execute(user.id, taskId);
    return { task };
  }

  @Post(':id/reorder')
  async reorderTask(
    @CurrentUser() user: JwtUser,
    @Param('id') taskId: string,
    @Body() dto: ReorderTaskDto,
  ): Promise<ReorderTaskResponseDto> {
    const task = await this.reorderTaskUseCase.execute(user.id, taskId, dto);
    return { task };
  }
}
