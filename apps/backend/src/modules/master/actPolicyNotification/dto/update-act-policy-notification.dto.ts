
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActPolicyNotificationTypeLocal } from './create-act-policy-notification.dto';

export class UpdateActPolicyNotificationDto {
  @IsOptional()
  @IsEnum(ActPolicyNotificationTypeLocal)
  type?: ActPolicyNotificationTypeLocal;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brief?: string;

  @IsOptional()
  @IsString()
  englishfilePath?: string;

  @IsOptional()
  @IsString()
  hindifilePath?: string;

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
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  departmentIds?: number[];
}
