import { IsString, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFinancialParameterDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  dataType?: string;

  @IsOptional()
  @IsBoolean()
  isCalculable?: boolean;

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
