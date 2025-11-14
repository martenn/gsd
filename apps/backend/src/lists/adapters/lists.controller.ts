import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetListsResponseDto, ListDto } from '@gsd/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/dto/jwt-user.dto';
import { GetLists } from '../use-cases/get-lists';
import { CreateList } from '../use-cases/create-list';
import { DeleteList } from '../use-cases/delete-list';
import { CreateListDto } from '../dto/create-list.dto';

@Controller('v1/lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(
    private readonly getListsUseCase: GetLists,
    private readonly createListUseCase: CreateList,
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
