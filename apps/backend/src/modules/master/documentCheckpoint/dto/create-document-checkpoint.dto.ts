import { IsString, IsBoolean, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentCheckpointDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  created?: string;

  @IsDateString()
  @IsOptional()
  modified?: string;

  @IsString()
  @IsOptional()
  filePath?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tenant_id?: number | null;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tenant_project_id?: number | null;
}
