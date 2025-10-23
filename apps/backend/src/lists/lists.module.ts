import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ListsController } from './adapters/lists.controller';
import { GetLists } from './use-cases/get-lists';
import { CreateList } from './use-cases/create-list';
import { ListsRepository } from './infra/lists.repository';

@Module({
  controllers: [ListsController],
  providers: [
    GetLists,
    CreateList,
    ListsRepository,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [GetLists, CreateList],
})
export class ListsModule {}
