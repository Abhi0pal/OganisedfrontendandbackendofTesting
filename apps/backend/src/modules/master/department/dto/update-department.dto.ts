import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  uniqueTag?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsInt()
  boDeptId?: number;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsInt()
  @IsOptional()
  issuerId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
