import { IsEnum, IsInt, IsObject, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { YnFlag } from '@prisma/client';

export class UpdateBuilderFieldDto {
  // ✅ FIX: Added formFieldId to allow changing source
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  formFieldId?: number;

  @IsOptional()
  @IsString()
  inputType?: string;

  @IsOptional()
  @IsString()
  customLabel?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsEnum(YnFlag)
  isRequired?: YnFlag;

  @IsOptional()
  @IsEnum(YnFlag)
  isEditable?: YnFlag;

  @IsOptional()
  @IsEnum(YnFlag)
  isReadonly?: YnFlag;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minLength?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxLength?: number;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsString()
  step?: string;

  @IsOptional()
  @IsObject()
  validationRule?: any;

  @IsOptional()
  @IsObject()
  componentProps?: any;

  @IsOptional()
  @IsString()
  layoutType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  gridSpan?: number;

  @IsOptional()
  @IsString()
  rowType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  preference?: number;

  @IsOptional()
  @IsEnum(YnFlag)
  isActive?: YnFlag;
}
