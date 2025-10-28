import {
  IsArray,
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BulkAddTasksRequest } from '@gsd/types';

class BulkTaskInput {
  @IsString()
  @MinLength(1, { message: 'Task title cannot be empty' })
  @MaxLength(500, { message: 'Task title must not exceed 500 characters' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'Task description must not exceed 5000 characters' })
  description?: string;
}

export class BulkAddTasksDto implements BulkAddTasksRequest {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one task must be provided' })
  @ArrayMaxSize(10, { message: 'Maximum 10 tasks allowed per bulk add request' })
  @ValidateNested({ each: true })
  @Type(() => BulkTaskInput)
  tasks: BulkTaskInput[];

  @IsUUID('4', { message: 'Invalid list ID format' })
  @IsOptional()
  listId?: string;
}
