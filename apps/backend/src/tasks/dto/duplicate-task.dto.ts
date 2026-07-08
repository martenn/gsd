import { IsOptional, IsUUID } from 'class-validator';
import type { DuplicateTaskRequest } from '@gsd/types';

export class DuplicateTaskDto implements DuplicateTaskRequest {
  @IsOptional()
  @IsUUID('4', { message: 'Invalid target list ID format' })
  targetListId?: string;
}
