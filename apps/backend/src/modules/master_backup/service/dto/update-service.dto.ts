
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ServiceStatusLocal } from './create-service.dto';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  service_id?: string;

  @IsOptional()
  @IsNumber()
  department_id?: number;

  @IsOptional()
  @IsNumber()
  issuer_id?: number;

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
