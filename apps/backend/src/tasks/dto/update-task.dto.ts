import { IsString, IsOptional, MinLength, MaxLength, ValidateIf } from 'class-validator';
import { UpdateTaskRequest } from '@gsd/types';

export class UpdateTaskDto implements UpdateTaskRequest {
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Task title cannot be empty' })
  @MaxLength(500, { message: 'Task title must not exceed 500 characters' })
  title?: string;

  @IsOptional()
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @MaxLength(5000, { message: 'Task description must not exceed 5000 characters' })
  description?: string | null;
}
