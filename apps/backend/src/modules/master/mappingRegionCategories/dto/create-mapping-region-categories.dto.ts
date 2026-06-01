import {
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMappingRegionCategoriesDto {
  @IsInt()
  blockId: number;

  @IsInt()
  regionCategoryId: number;

  @Type(() => Date)
  @IsDate()
  effectiveFrom: Date;

  @Type(() => Date)
  @IsDate()
  effectiveTo: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
