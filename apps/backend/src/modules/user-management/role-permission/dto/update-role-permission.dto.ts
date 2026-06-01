import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { PermissionEffect } from '@prisma/client';

export class UpdateRolePermissionDto {

  @IsOptional()
  @IsEnum(PermissionEffect)
  effect?: PermissionEffect; // ALLOW ↔ DENY

  @IsOptional()
  @IsBoolean()
  is_active?: boolean; // Enable / disable permission
}