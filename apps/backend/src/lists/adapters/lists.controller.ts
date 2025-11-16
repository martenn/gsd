import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  GetListsResponseDto,
  ListDto,
  UpdateListResponseDto,
  ToggleBacklogResponseDto,
  ReorderListResponseDto,
} from '@gsd/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/dto/jwt-user.dto';
import { GetLists } from '../use-cases/get-lists';
import { CreateList } from '../use-cases/create-list';
import { UpdateList } from '../use-cases/update-list';
import { ToggleBacklog } from '../use-cases/toggle-backlog';
import { ReorderList } from '../use-cases/reorder-list';
import { DeleteList } from '../use-cases/delete-list';
import { CreateListDto } from '../dto/create-list.dto';
import { UpdateListDto } from '../dto/update-list.dto';
import { ReorderListDto } from '../dto/reorder-list.dto';

@Controller('v1/lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(
    private readonly getListsUseCase: GetLists,
    private readonly createListUseCase: CreateList,
    private readonly updateListUseCase: UpdateList,
    private readonly toggleBacklogUseCase: ToggleBacklog,
    private readonly reorderListUseCase: ReorderList,
    private readonly deleteListUseCase: DeleteList,
  ) {}

  @Get()
  async getLists(@CurrentUser() user: JwtUser): Promise<GetListsResponseDto> {
    const lists = await this.getListsUseCase.execute(user.id);
    return { lists };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createList(
    @CurrentUser() user: JwtUser,
    @Body() createListDto: CreateListDto,
  ): Promise<ListDto> {
    return this.createListUseCase.execute(user.id, createListDto);
  }

  @Patch(':id')
  async updateList(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() updateListDto: UpdateListDto,
  ): Promise<UpdateListResponseDto> {
    const list = await this.updateListUseCase.execute(user.id, id, updateListDto);
    return { list };
  }

  @Post(':id/toggle-backlog')
  async toggleBacklog(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ): Promise<ToggleBacklogResponseDto> {
    const list = await this.toggleBacklogUseCase.execute(user.id, id);
    return { list };
  }

  @Post(':id/reorder')
  async reorderList(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() reorderListDto: ReorderListDto,
  ): Promise<ReorderListResponseDto> {
    const list = await this.reorderListUseCase.execute(user.id, id, reorderListDto);
    return { list };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteList(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Query('destListId') destListId?: string,
  ): Promise<void> {
    await this.deleteListUseCase.execute(user.id, id, destListId);
  }
}
