import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ListsController } from './adapters/lists.controller';
import { GetLists } from './use-cases/get-lists';
import { CreateList } from './use-cases/create-list';
import { DeleteList } from './use-cases/delete-list';
import { ListsRepository } from './infra/lists.repository';
import { ColorModule } from '../colors/color.module';

@Module({
  imports: [ColorModule],
  controllers: [ListsController],
  providers: [
    GetLists,
    CreateList,
    DeleteList,
    ListsRepository,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [GetLists, CreateList, DeleteList, ListsRepository],
})
export class ListsModule {}
