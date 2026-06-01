import { IsString, IsBoolean, IsOptional, IsDate, IsNumber, IsUUID , IsInt} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKyiIcCalculatorDto {
  @IsOptional()
  @IsNumber()
  benefit_percent_amount?: number;

  @IsOptional()
  @IsNumber()
  cap_limit?: number;

  @IsOptional()
  @IsNumber()
  extra_fixed_amount?: number;

  @IsOptional()
  @IsNumber()
  above_calculating_amount?: number;

  @IsOptional()
  @IsNumber()
  years_of_recurring?: number;

  @IsOptional()
  @IsString()
  eligibility_notes?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  limitation?: string;

@IsOptional()
@Type(() => Number) // ensures the string from query/body is converted to number
@IsInt()
policy_id?: number;

  @IsOptional()
  @IsNumber()
  msme_year_value?: number;

  @IsOptional()
  @IsNumber()
  unit_category_value?: number;

  @IsOptional()
  @IsNumber()
  unit_type_value?: number;

  @IsOptional()
  @IsNumber()
  sector_value?: number;

  @IsOptional()
  @IsNumber()
  sub_sector_value?: number;

  @IsOptional()
  @IsNumber()
  ocurrance_value?: number;

  @IsOptional()
  @IsNumber()
  block_value?: number;

  @IsOptional()
  @IsNumber()
  region_category_value?: number;

  @IsOptional()
  @IsNumber()
  land_type_value?: number;

  @IsOptional()
  @IsNumber()
  beneficiary_type_value?: number;

  @IsOptional()
  @IsNumber()
  anchor_unit_value?: number;

  @IsOptional()
  @IsNumber()
  incentive_mapping_id?: number;

  @IsOptional()
  @IsNumber()
  incentive_value?: number;

  @Type(() => Date)
  @IsDate()
  effectiveFrom!: Date;

  @Type(() => Date)
  @IsDate()
  effectiveTo!: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
