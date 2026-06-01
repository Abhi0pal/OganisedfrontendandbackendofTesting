import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAddMoreGroupDto {
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

  @Type(() => Number)
  @IsInt()
  triggerBuilderFieldId: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minRows?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxRows?: number;
}