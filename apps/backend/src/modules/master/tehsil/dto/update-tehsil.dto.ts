import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class UpdateTehsilDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  districtId?: number;

  @IsOptional()
  @IsInt()
  stateId?: number;

  @IsOptional()
  @IsString()
  subDistrictCode?: string;

  @IsOptional()
  @IsInt()
  deptDivisionId?: number;

  @IsOptional()
  @IsInt()
  lgDistrictId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
