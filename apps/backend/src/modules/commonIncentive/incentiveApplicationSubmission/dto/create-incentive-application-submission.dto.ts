import { IsInt, IsOptional, IsString, IsEnum, IsJSON } from "class-validator";
import { ApplicationStatus, RecordStatus } from "@prisma/client";

export class CreateIncentiveApplicationSubmissionDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsInt()
  incentiveId!: number;

  @IsOptional()
  @IsInt()
  cafId?: number;

  @IsOptional()
  @IsInt()
  parentAppId?: number;

  @IsInt()
  departmentId!: number;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  sectorId?: string;

  @IsOptional()
  @IsString()
  unitName?: string;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsJSON()
  postData?: any;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  applicationStatus?: ApplicationStatus; // default: DRAFT

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus; // default: Y

  @IsOptional()
  createdOn?: Date;

  @IsOptional()
  @IsInt()
  installmentNo?: number;

  @IsOptional()
  @IsString()
  fy?: string;

  @IsOptional()
  @IsString()
  certificateNumber?: string;

}

