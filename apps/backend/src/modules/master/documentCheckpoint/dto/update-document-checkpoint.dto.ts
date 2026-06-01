import { IsString, IsBoolean, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDocumentCheckpointDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  created?: string;

  @IsOptional()
  @IsDateString()
  modified?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  tenant_id?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  tenant_project_id?: number | null;
}
