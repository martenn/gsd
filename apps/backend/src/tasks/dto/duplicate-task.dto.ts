import { IsIn, IsOptional } from 'class-validator';
import type { DuplicateTaskRequest, DuplicateTaskTarget } from '@gsd/types';

export class DuplicateTaskDto implements DuplicateTaskRequest {
  @IsOptional()
  @IsIn(['in-place', 'origin-backlog'])
  target?: DuplicateTaskTarget;
}
