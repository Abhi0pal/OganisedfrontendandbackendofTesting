import {
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
} from "class-validator";
import { TransferReason } from "@prisma/client";

export class UpdateUserRoleAssignmentDto {
  // Core relations (updatable if business rules allow)
  @IsOptional()
  @IsInt()
  roleId?: number;

  @IsOptional()
  @IsInt()
  tenantId?: number;

  @IsOptional()
  @IsInt()
  projectId?: number;

  // Validity period
  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  // Transfer-related updates
  @IsOptional()
  @IsString()
  transferOrderNo?: string;

  @IsOptional()
  @IsEnum(TransferReason)
  transferReason?: TransferReason;

  @IsOptional()
  @IsInt()
  transferredFromId?: number;

  // Metadata
  @IsOptional()
  @IsInt()
  assignedBy?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}