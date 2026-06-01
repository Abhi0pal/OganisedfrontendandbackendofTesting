import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';

import { ServiceStatusLocal } from './create-service.dto';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @IsOptional()
  @IsNumber()
  issuerId?: number;

  @IsOptional()
  @IsNumber()
  swcsServiceId?: number;

  @IsOptional()
  @IsString()
  serviceLevel?: string;

  @IsOptional()
  @IsString()
  documentChecklist?: string;

  @IsOptional()
  @IsArray()
  documentChecklistMapping?: any[];

  @IsOptional()
  @IsArray()
  documentTypeMapping?: any[];

  @IsOptional()
  @IsArray()
  documentCheckpointMapping?: any[];

  @IsOptional()
  dms?: any;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsString()
  nameInHindi?: string;

  @IsOptional()
  @IsString()
  subDepartment?: string;

  @IsOptional()
  @IsString()
  actName?: string;

  @IsOptional()
  @IsBoolean()
  isInSwcsAct?: boolean;

  @IsOptional()
  @IsBoolean()
  isIntegratedWithDms?: boolean;

  @IsOptional()
  @IsEnum(ServiceStatusLocal)
  serviceStatus?: ServiceStatusLocal;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipaddress?: string;

  @IsOptional()
  @IsDateString()
  serviceGoLiveDate?: string;

  @IsOptional()
  @IsDateString()
  serviceEndDate?: string;

  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsString()
  popupData?: string | null;

  @IsOptional()
  @IsBoolean()
  enablePreview?: boolean;
}
