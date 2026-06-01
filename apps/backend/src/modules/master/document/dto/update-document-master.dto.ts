import { IsString, IsInt, IsBoolean, IsOptional, Min, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDocumentMasterDto {
  @IsOptional()
  @IsInt()
  stateId?: number;

  @IsOptional()
  @IsInt()
  issuerId?: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  documentTypeId?: number;

  @IsOptional()
  @IsString()
  checklistDocumentName?: string;

  @IsOptional()
  @IsString()
  checklistDocumentExtension?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  checklistDocumentMaxSize?: number;

  @IsOptional()
  @IsString()
  prescribedDocumentPath?: string;

  @IsOptional()
  @IsArray()
  services?: number[];

  @IsOptional()
  @IsArray()
  documentCheckpoints?: number[];

  @IsOptional()
  @IsBoolean()
  isMultiVersionAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  isDocValidityRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isDocReferenceNumberRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isAutoInsertAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  isDocActive?: boolean;

  @IsOptional()
  @IsInt()
  issuerById?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  tenant_id?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  tenant_project_id?: number | null;
}
