import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OptionSourceType } from '@prisma/client';

export class StaticOptionDto {
  @IsNotEmpty()
  label!: string;

  @IsNotEmpty()
  value!: string;

  @IsOptional()
  disabled?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class SaveFieldOptionsDto {
  @IsEnum(OptionSourceType)
  sourceType!: OptionSourceType;

  @IsOptional()
  @IsInt()
  masterTableId?: number;

  @IsOptional()
  @IsInt()
  parentBuilderFieldId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaticOptionDto)
  staticOptions?: StaticOptionDto[];
}