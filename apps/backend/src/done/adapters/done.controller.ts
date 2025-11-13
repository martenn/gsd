import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetDoneResponseDto } from '@gsd/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/dto/jwt-user.dto';
import { GetDoneTasks } from '../use-cases/get-done-tasks';
import { GetDoneQueryDto } from '../dto/get-done-query.dto';

@Controller('v1/done')
export class DoneController {
  constructor(private readonly getDoneTasksUseCase: GetDoneTasks) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getDoneTasks(
    @CurrentUser() user: JwtUser,
    @Query() query: GetDoneQueryDto,
  ): Promise<GetDoneResponseDto> {
    return this.getDoneTasksUseCase.execute(user.id, query);
  }
}
