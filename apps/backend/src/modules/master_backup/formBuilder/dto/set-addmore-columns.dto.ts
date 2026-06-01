import { ArrayMinSize, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SetAddMoreColumnsDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  columnBuilderFieldIds: number[];
}