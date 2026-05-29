import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { MoveTaskRequest } from '@gsd/types';

export class MoveTaskDto implements MoveTaskRequest {
  @IsUUID('4', { message: 'Invalid list ID format' })
  listId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  newOrderIndex?: number;
}
