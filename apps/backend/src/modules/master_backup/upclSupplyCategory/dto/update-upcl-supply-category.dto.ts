import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUpclSupplyCategoryDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  parent?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

