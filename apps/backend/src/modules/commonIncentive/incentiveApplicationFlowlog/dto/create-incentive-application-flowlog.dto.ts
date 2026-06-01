import { IsInt, IsOptional, IsString, IsEnum, IsJSON , IsNumberString} from "class-validator";
import {
  ApprovalStatus,
  ApplicationStatus,
  RecordStatus,
  RecommendationStatus,
} from "@prisma/client";
import { Transform } from 'class-transformer';

export class CreateIncentiveApplicationFlowlogDto {
  @IsInt()
  applicationId!: number;

  @IsInt()
  currentRoleId!: number;

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

  @IsEnum(ApprovalStatus)
  approvalStatus!: ApprovalStatus;

  @IsEnum(ApplicationStatus)
  actionStatus!: ApplicationStatus;

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
  createdDate?: Date;

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