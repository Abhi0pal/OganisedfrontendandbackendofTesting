import { IsInt, IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { PermissionAction } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdatePermissionDto {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  module_id?: number;

  @IsEnum(PermissionAction)
  @IsOptional()
  action?: PermissionAction;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}