import { IsString, IsInt, IsBoolean, IsOptional, Min, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentMasterDto {
  @IsInt()
  stateId: number;

  @IsInt()
  issuerId: number;

  @IsInt()
  departmentId: number;

  @IsOptional()
  @IsInt()
  documentTypeId?: number;

  @IsString()
  checklistDocumentName: string;

  @IsString()
  checklistDocumentExtension: string;

  @IsInt()
  @Min(1)
  checklistDocumentMaxSize: number; // In bytes

  @IsOptional()
  @IsString()
  prescribedDocumentPath?: string;

  // ✅ NEW FIELDS
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