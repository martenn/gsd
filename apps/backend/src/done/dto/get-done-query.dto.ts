import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { GetDoneQuery } from '@gsd/types';

export class GetDoneQueryDto implements GetDoneQuery {
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
