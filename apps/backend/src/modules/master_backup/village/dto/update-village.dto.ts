import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class UpdateVillageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  tehsilId?: number;

  @IsOptional()
  @IsString()
  villageCode?: string;

  @IsOptional()
  @IsString()
  subDistrictCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
