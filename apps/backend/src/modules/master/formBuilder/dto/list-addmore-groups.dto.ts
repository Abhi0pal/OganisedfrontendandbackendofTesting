import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAddMoreGroupsQueryDto {
  @IsString()
  serviceId: string;

  @Type(() => Number)
  @IsInt()
  formTypeId: number;

  @Type(() => Number)
  @IsInt()
  pageId: number;

  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  triggerBuilderFieldId?: number;
}