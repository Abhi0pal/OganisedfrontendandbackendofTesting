import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @Type(() => Number)
  @IsInt()
  id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  preference: number;
}

export class ReorderBuilderFieldsDto {
  @IsArray()
  @ArrayMinSize(1)
  items: ReorderItemDto[];
}