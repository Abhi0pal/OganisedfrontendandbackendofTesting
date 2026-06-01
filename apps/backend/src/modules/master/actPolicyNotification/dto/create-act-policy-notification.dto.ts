
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

// Local enum with EXACT values as schema.prisma
export enum ActPolicyNotificationTypeLocal {
  Act = 'Act',
  Policy = 'Policy',
  Notification = 'Notification',
}

export class CreateActPolicyNotificationDto {
  @IsOptional()
  @IsEnum(ActPolicyNotificationTypeLocal)
  type?: ActPolicyNotificationTypeLocal;

  @IsOptional()
  @IsString()
  level?: string;

  @IsString()
  name: string;

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
