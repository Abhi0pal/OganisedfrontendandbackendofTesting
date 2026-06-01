import { IsInt, IsOptional, IsString, IsNumberString, IsEnum, IsJSON } from "class-validator";
import {
  ApprovalStatus,
  ApplicationStatus,
  RecordStatus,
  RecommendationStatus,
} from "@prisma/client";
import { Transform } from 'class-transformer';

// update-flowlog.dto.ts

export class UpdateIncentiveApplicationFlowlogDto {
  @IsOptional()
  @IsInt()
  currentRoleId?: number;

  @IsOptional()
  @IsInt()
  nextRoleId?: number;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => (value != null ? String(value) : value))
  approvedAmountByDepartment?: string;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => (value != null ? String(value) : value))
  disbursedAmountByDepartment?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  delayRemarks?: string;

  @IsOptional()
  @IsString()
  additionalPostData?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  actionStatus?: ApplicationStatus;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  remoteIpAddress?: string;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsOptional()
  @IsString()
  file?: string;

  @IsOptional()
  @IsString()
  uploadedFileName?: string;

  @IsOptional()
  @IsJSON()
  approvedIncentive?: any;

  @IsOptional()
  @IsEnum(RecommendationStatus)
  recommendation?: RecommendationStatus;

}
