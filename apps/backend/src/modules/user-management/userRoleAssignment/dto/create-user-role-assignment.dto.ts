import {
  IsInt,
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
  IsDateString,
} from "class-validator";
import { TransferReason } from "@prisma/client";

export class CreateUserRoleAssignmentDto {
  // Core relations
  @IsInt()
  userId!: number; // maps to user_id (BigInt in DB)

  @IsInt()
  roleId!: number; // role_id

  @IsInt()
  tenantId!: number; // tenant_id

  @IsOptional()
  @IsInt()
  projectId?: number; // project_id

  // Validity / lifecycle
  @IsOptional()
  @IsDateString()
  validFrom?: Date; // default: now()

  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  // Transfer-related fields
  @IsOptional()
  @IsString()
  transferOrderNo?: string;

  @IsOptional()
  @IsEnum(TransferReason)
  transferReason?: TransferReason;

  @IsOptional()
  @IsInt()
  transferredFromId?: number;

  // Audit & metadata
  @IsOptional()
  @IsInt()
  assignedBy?: number; // BigInt in DB

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // default: true
}
