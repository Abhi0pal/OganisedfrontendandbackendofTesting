import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ScopeType } from '@prisma/client';

export class CreateUserManagementScopeDto {
  @IsString()
  assignment_id: string;

  @IsEnum(ScopeType)
  scope_type: ScopeType;

  @IsString()
  scope: string;

  @IsOptional()
  @IsString()
  scope_label?: string;

  @IsOptional()
  @IsString()
  tenant?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
