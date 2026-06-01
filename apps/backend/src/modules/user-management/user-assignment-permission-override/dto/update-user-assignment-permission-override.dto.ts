import { IsEnum, IsOptional, IsBoolean, IsString } from 'class-validator';
import { PermissionEffect } from '@prisma/client';

export class UpdateUserAssignmentPermissionOverrideDto {
  @IsOptional()
  @IsEnum(PermissionEffect)
  effect?: PermissionEffect;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}