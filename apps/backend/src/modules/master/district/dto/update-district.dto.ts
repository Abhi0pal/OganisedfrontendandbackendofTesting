import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateDistrictDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  stateCode?: string;

  @IsOptional()
  @IsString()
  districtCode?: string;

  @IsOptional()
  @IsNumber()
  stateId?: number;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsString()
  latlong?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}