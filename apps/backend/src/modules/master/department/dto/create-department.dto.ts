import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsString()
  uniqueTag: string;

  @IsString()
  ip: string;

  @IsString()
  secretKey: string;

  @IsString()
  baseUrl: string;

  @IsString()
  publicKey: string;

  @IsString()
  abbreviation: string;

  @IsInt()
  @IsOptional()
  boDeptId?: number;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsInt()
  @IsOptional()
  issuerId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
