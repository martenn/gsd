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
} from '@nestjs/common';
import { GetListsResponseDto, ListDto } from '@gsd/types';
import { GetLists } from '../use-cases/get-lists';
import { CreateList } from '../use-cases/create-list';
import { DeleteList } from '../use-cases/delete-list';
import { CreateListDto } from '../dto/create-list.dto';

@Controller('v1/lists')
export class ListsController {
  constructor(
    private readonly getListsUseCase: GetLists,
    private readonly createListUseCase: CreateList,
    private readonly deleteListUseCase: DeleteList,
  ) {}

  @Get()
  async getLists(): Promise<GetListsResponseDto> {
    const userId = 'mock-user-id';
    const lists = await this.getListsUseCase.execute(userId);
    return { lists };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createList(@Body() createListDto: CreateListDto): Promise<ListDto> {
    const userId = 'mock-user-id';
    return this.createListUseCase.execute(userId, createListDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteList(
    @Param('id') id: string,
    @Query('destListId') destListId?: string,
  ): Promise<void> {
    const userId = 'mock-user-id';
    await this.deleteListUseCase.execute(userId, id, destListId);
  }
}
