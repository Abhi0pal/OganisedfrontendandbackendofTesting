import { IsString, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRegionCategoriesDto {
  @IsString()
  name: string;

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
