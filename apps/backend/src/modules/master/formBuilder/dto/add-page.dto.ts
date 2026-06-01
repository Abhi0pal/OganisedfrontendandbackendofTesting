import { IsOptional, IsString, IsNumber } from 'class-validator';

export class AddPageDto {
  @IsOptional()
  @IsString()
  pageName?: string;

  @IsOptional()
  @IsString()
  nameInHindi?: string;

  @IsOptional()
  @IsString()
  formCode?: string;

  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsNumber()
  roleId?: number;
}