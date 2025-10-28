import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';
import { CreateTaskRequest } from '@gsd/types';

export class CreateTaskDto implements CreateTaskRequest {
  @IsString()
  @MinLength(1, { message: 'Task title cannot be empty' })
  @MaxLength(500, { message: 'Task title must not exceed 500 characters' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'Task description must not exceed 5000 characters' })
  description?: string;

  @IsUUID('4', { message: 'Invalid list ID format' })
  listId: string;
}
