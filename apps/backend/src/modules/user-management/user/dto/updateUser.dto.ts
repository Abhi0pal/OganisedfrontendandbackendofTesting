import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEmail,
  IsEnum,
} from 'class-validator';

import { user_type } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(user_type)
  user_type?: user_type;

  @IsOptional()
  @IsInt()
  role_id?: number | null;

  @IsOptional()
  @IsInt()
  tenant_id?: number | null;

  @IsOptional()
  @IsInt()
  project_id?: number | null;

  @IsOptional()
  @IsInt()
  department_id!: number | null;

  @IsOptional()
  @IsInt()
  sub_department_id?: number | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  is_email_verified?: number;

  // ================= INVESTOR =================

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  country_name?: string;

  @IsOptional()
  @IsString()
  state_name?: string;

  @IsOptional()
  @IsString()
  city_name?: string;

  @IsOptional()
  @IsString()
  district_name?: string;

  @IsOptional()
  @IsString()
  pin_code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  pan_card?: string;

  @IsOptional()
  @IsString()
  adhaar_number?: string;

  // ================= DEPARTMENT =================

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  hindi_full_name?: string;

  @IsOptional()
  @IsString()
  office_no?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsInt()
  dept_id?: number;

  @IsOptional()
  @IsInt()
  district_id?: number;

  @IsOptional()
  @IsInt()
  tehsil_id?: number;

  @IsOptional()
  @IsString()
  circle_id?: string;

  @IsOptional()
  @IsInt()
  block_id?: number;

  @IsOptional()
  @IsInt()
  office_id?: number;

  @IsOptional()
  @IsInt()
  division_id?: number;
}
