import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentTypeDto {
  @IsString()
  name: string;

  @IsString()
  abbreviation: string;

  @IsBoolean()
  @IsOptional()
  isDocActive?: boolean;

  @IsBoolean()
  @IsOptional()
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
