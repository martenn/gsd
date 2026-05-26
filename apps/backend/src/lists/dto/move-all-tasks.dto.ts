import { IsUUID } from 'class-validator';
import { MoveAllTasksRequest } from '@gsd/types';

export class MoveAllTasksDto implements MoveAllTasksRequest {
  @IsUUID('4')
  destinationListId!: string;
}
