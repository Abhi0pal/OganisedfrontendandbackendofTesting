import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUnitCategoriesDto {
  @IsString()
  name: string;

  @IsInt()
  msmeYearId: number;

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
