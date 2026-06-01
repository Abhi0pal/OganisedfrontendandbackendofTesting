import { IsInt, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMappingRegionCategoriesDto {
  @IsOptional()
  @IsInt()
  blockId?: number;

  @IsOptional()
  @IsInt()
  regionCategoryId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
