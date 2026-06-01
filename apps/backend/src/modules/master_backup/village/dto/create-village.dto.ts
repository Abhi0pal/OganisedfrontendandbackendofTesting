import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateVillageDto {
  @IsString()
  name: string;

  @IsInt()
  tehsilId: number;

  @IsString()
  villageCode: string;

  @IsString()
  @IsOptional()
  subDistrictCode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
