import { IsInt, IsOptional, IsString, IsEnum, IsJSON } from "class-validator";
import { ApplicationStatus, RecordStatus } from "@prisma/client";


export class UpdateIncentiveApplicationSubmissionDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  incentiveId?: number;

  @IsOptional()
  @IsInt()
  cafId?: number;

  @IsOptional()
  @IsInt()
  parentAppId?: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;

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
  applicationStatus?: ApplicationStatus;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

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