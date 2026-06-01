
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFormCategoryDto {
  @IsString()
  categoryName!: string;

  @IsOptional()
  @IsString()
  nameInHindi?: string;

  @IsOptional()
  @IsString()
  nameAlt?: string;

  @IsOptional()
  @IsNumber()
  parentId?: number; // 0 = root

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
