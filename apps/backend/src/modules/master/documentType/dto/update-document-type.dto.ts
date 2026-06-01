import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDocumentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsBoolean()
  isDocActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFormatRequired?: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tenant_id?: number | null;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tenant_project_id?: number | null;
}
