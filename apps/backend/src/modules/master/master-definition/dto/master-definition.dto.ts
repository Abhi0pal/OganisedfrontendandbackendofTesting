import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateMasterDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @Type(() => Number)
  @IsInt()
  tenantId: number;

  @Type(() => Number)
  @IsInt()
  projectId: number;

  @IsOptional()
  departmentId?: string | number | null;

  @IsOptional()
  subDepartmentId?: string | number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  parentMasterCode?: string | null;
}

export class UpdateMasterDefinitionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tenantId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectId?: number;

  @IsOptional()
  departmentId?: string | number | null;

  @IsOptional()
  subDepartmentId?: string | number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  parentMasterCode?: string | null;
}
