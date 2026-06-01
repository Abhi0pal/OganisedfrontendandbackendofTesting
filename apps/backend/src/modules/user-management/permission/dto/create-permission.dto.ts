import { IsInt, IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { PermissionAction } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePermissionDto {
  @IsInt()
  @Type(() => Number)
  module_id!: number;

  @IsEnum(PermissionAction)
  action!: PermissionAction;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}