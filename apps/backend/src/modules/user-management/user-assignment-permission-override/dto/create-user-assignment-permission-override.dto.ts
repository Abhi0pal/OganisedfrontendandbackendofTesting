import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { PermissionEffect } from '@prisma/client';

export class CreateUserAssignmentPermissionOverrideDto {
  @IsString()
  assignment_id!: string;

  @IsInt()
  permission_id!: number;

  @IsEnum(PermissionEffect)
  effect!: PermissionEffect;

  @IsOptional()
  @IsString()
  reason?: string;
}
