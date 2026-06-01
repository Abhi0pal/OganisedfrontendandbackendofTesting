
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
} from 'class-validator';

// Local enum mirroring schema.prisma ServiceStatus
export enum ServiceStatusLocal {
  ONLINE_ON_DEPT_PORTAL = 'ONLINE_ON_DEPT_PORTAL',
  INTEGRATED = 'INTEGRATED',
  ONBOARDED = 'ONBOARDED',
  OFFLINE = 'OFFLINE',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  INCENTIVE = 'INCENTIVE',
}

export class CreateServiceDto {
  @IsOptional()
  @IsString()
  service_id?: string;

  @IsOptional()
  @IsNumber()
  department_id?: number;

  // issuer_id: Int?
  @IsOptional()
  @IsNumber()
  issuer_id?: number;

  // swcs_service_id: Int?
  @IsOptional()
  @IsNumber()
  swcs_service_id?: number;

  @IsOptional()
  @IsString()
  service_level?: string;

  @IsOptional()
  @IsString()
  document_checklist?: string;

  @IsOptional()
  @IsArray()
  document_checklist_mapping?: any[];

  @IsOptional()
  @IsArray()
  document_type_mapping?: any[];

  @IsOptional()
  @IsArray()
  document_checkpoint_mapping?: any[];

  @IsOptional()
  dms?: any;

  @IsOptional()
  @IsString()
  comments?: string;

  // service_name: String?
  @IsOptional()
  @IsString()
  service_name?: string;

  @IsOptional()
  @IsString()
  nameInHindi?: string;

  @IsOptional()
  @IsString()
  service_url?: string;

  @IsOptional()
  @IsString()
  development_url?: string;

  @IsOptional()
  @IsBoolean()
  is_in_SWCS_act?: boolean;

  @IsOptional()
  @IsBoolean()
  is_integrated_with_dms?: boolean;

  @IsOptional()
  @IsEnum(ServiceStatusLocal)
  service_status?: ServiceStatusLocal;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsOptional()
  @IsString()
  ipaddress?: string;

  @IsOptional()
  @IsDateString()
  service_go_live_date?: string;

  @IsOptional()
  @IsDateString()
  service_end_date?: string;

  @IsOptional()
  @IsNumber()
  issuerbyId?: number;
}
