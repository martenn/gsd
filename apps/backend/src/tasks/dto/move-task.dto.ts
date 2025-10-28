import { IsUUID } from 'class-validator';
import { MoveTaskRequest } from '@gsd/types';

export class MoveTaskDto implements MoveTaskRequest {
  @IsUUID('4', { message: 'Invalid list ID format' })
  listId: string;
}
