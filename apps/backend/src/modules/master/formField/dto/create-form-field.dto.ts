
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFormFieldDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  nameInHindi?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

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
