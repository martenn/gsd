import { IsString, IsBoolean, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { CreateListRequest } from '@gsd/types';

export class CreateListDto implements CreateListRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsBoolean()
  @IsOptional()
  isBacklog?: boolean;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g., #3B82F6)' })
  color?: string;
}
