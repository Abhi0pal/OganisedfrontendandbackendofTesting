import { IsInt, IsEnum, IsOptional, IsBoolean, IsPositive } from 'class-validator';
import { PermissionEffect } from '@prisma/client';

export class CreateRolePermissionDto {

  @IsInt()
  @IsPositive()
  role_id!: number;

  @IsInt()
  @IsPositive()
  permission_id!: number;

  @IsOptional()
  @IsEnum(PermissionEffect)
  effect?: PermissionEffect; // ALLOW / DENY

  @IsOptional()
  @IsBoolean()
  is_active?: boolean; // defaults to true in Prisma

  @IsOptional()
  @IsInt()
  created_by?: number; // mapped to BigInt in DB
}
