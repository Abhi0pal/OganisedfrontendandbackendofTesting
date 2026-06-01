import { IsString, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBeneficiaryTypesDto {
  @IsOptional()
  @IsString()
  name?: string;

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
