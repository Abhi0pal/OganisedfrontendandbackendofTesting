
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFormCategoryDto {
  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  nameInHindi?: string;

  @IsOptional()
  @IsString()
  nameAlt?: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @IsOptional()
  @IsNumber()
  projectId?: number;
}
