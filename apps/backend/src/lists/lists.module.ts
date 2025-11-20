import { Module } from '@nestjs/common';
import { ListsController } from './adapters/lists.controller';
import { GetLists } from './use-cases/get-lists';
import { CreateList } from './use-cases/create-list';
import { UpdateList } from './use-cases/update-list';
import { ToggleBacklog } from './use-cases/toggle-backlog';
import { ReorderList } from './use-cases/reorder-list';
import { DeleteList } from './use-cases/delete-list';
import { ListsRepository } from './infra/lists.repository';
import { ColorModule } from '../colors/color.module';

@Module({
  imports: [ColorModule],
  controllers: [ListsController],
  providers: [
    GetLists,
    CreateList,
    UpdateList,
    ToggleBacklog,
    ReorderList,
    DeleteList,
    ListsRepository,
  ],
  exports: [
    GetLists,
    CreateList,
    UpdateList,
    ToggleBacklog,
    ReorderList,
    DeleteList,
    ListsRepository,
  ],
})
export class ListsModule {}
