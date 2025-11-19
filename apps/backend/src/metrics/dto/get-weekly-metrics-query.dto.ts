import { IsOptional, IsString, Matches, IsISO8601 } from 'class-validator';
import { GetWeeklyMetricsQuery } from '@gsd/types';

export class GetWeeklyMetricsQueryDto implements GetWeeklyMetricsQuery {
  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]+\/[A-Za-z_]+$/, {
    message: 'Invalid timezone format. Use IANA timezone (e.g., America/New_York)',
  })
  timezone?: string;
}
