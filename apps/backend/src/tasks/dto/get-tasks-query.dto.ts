import { IsUUID, IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { GetTasksQuery } from '@gsd/types';

export class GetTasksQueryDto implements GetTasksQuery {
  @IsUUID('4', { message: 'Invalid list ID format' })
  @IsOptional()
  listId?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeCompleted?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
