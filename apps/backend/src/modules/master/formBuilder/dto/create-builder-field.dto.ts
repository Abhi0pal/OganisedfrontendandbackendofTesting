import { IsInt, IsOptional, IsString, Min, Max, IsEnum, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { YnFlag } from '@prisma/client';

export class CreateBuilderFieldDto {
  @IsString()
  serviceId!: string;

  @Type(() => Number)
  @IsInt()
  formTypeId!: number;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle string "undefined" or "null" or empty string or actual null/undefined
    if (value === 'undefined' || value === 'null' || value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num; // Return value if NaN to let @IsInt fail, or return number
  })
  @IsInt()
  mappingId?: number;

  @Type(() => Number)
  @IsInt()
  formFieldId!: number;

  @IsString()
  inputType!: string;

  @IsOptional()
  @IsString()
  customLabel?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  // ✅ Added missing field
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

  // ✅ Added missing field
  @IsOptional()
  @IsObject()
  componentProps?: any;

  // ✅ Added missing field
  @IsOptional()
  @IsString()
  layoutType?: string;

  // ✅ Added missing field
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
  @Type(() => Number)
  @IsInt()
  userId?: number | null;
}
