import { IsNumber, IsString, IsOptional, ValidateIf } from 'class-validator';
import { ReorderTaskRequest } from '@gsd/types';

export class ReorderTaskDto implements ReorderTaskRequest {
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.afterTaskId === undefined)
  newOrderIndex?: number;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.newOrderIndex === undefined)
  afterTaskId?: string;
}
