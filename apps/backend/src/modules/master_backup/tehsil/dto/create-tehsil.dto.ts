import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateTehsilDto {
  @IsString()
  name: string;

  @IsInt()
  districtId: number;

  @IsInt()
  stateId: number;

  @IsString()
  @IsOptional()
  subDistrictCode?: string;

  @IsInt()
  @IsOptional()
  deptDivisionId?: number;

  @IsInt()
  @IsOptional()
  lgDistrictId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
