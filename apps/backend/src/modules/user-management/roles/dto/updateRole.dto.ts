
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNotEmpty
} from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsInt()
  tenant_id?: number | null;

  @IsOptional()
  @IsInt()
  project_id?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parent_id?: number | null;

  @IsOptional()
  @IsInt()
  level?: number;

  @IsOptional()
  @IsBoolean()
  is_system?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}