import { IsInt, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateInvestorDocumentDto {
  @IsInt()
  documentMasterId: number;

  @IsInt()
  documentTypeId: number;

  @IsInt()
  issuerId: number;

  @IsInt()
  departmentId: number;

  @IsString()
  checklistId: string;

  @IsString()
  documentName: string;

  @IsString()
  documentPath: string;

  /** ✅ Optional: keep version in DB identical to uploaded file name */
  @IsOptional()
  @IsString()
  documentVersion?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsDateString()
  documentDateOfIssuance?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
