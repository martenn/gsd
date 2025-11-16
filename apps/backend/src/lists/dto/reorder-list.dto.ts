import { IsNumber, IsUUID, IsOptional, ValidateIf } from 'class-validator';
import { ReorderListRequest } from '@gsd/types';

export class ReorderListDto implements ReorderListRequest {
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => !o.afterListId)
  newOrderIndex?: number;

  @IsUUID('4')
  @IsOptional()
  @ValidateIf((o) => !o.newOrderIndex)
  afterListId?: string;

  @ValidateIf((o) => !o.newOrderIndex && !o.afterListId)
  _atLeastOne?: never;
}
