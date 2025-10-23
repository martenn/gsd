import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { GetListsResponseDto, ListDto } from '@gsd/types';
import { GetLists } from '../use-cases/get-lists';
import { CreateList } from '../use-cases/create-list';
import { CreateListDto } from '../dto/create-list.dto';

@Controller('v1/lists')
export class ListsController {
  constructor(
    private readonly getListsUseCase: GetLists,
    private readonly createListUseCase: CreateList,
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
}
