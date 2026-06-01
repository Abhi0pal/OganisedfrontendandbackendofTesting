import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';

export enum ServiceStatusLocal {
  Integrated = 'Integrated',
  Onboarded = 'Onboarded',
  INTEGRATED = 'INTEGRATED',
  ONBOARDED = 'ONBOARDED',
}

export class CreateServiceDto {
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
  serviceLevel?: any;

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
  @IsEnum(ServiceStatusLocal)
  serviceStatus?: ServiceStatusLocal;

  @IsOptional()
  @IsDateString()
  serviceGoLiveDate?: string;

  @IsOptional()
  @IsDateString()
  serviceEndDate?: string;

  @IsOptional()
  @IsBoolean()
  isInSwcsAct?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
