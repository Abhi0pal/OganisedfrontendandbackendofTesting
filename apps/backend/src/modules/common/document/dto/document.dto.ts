import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DocumentChecklistQueryDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;
}

export class DocumentUploadsQueryDto {
  @IsNotEmpty()
  submissionId: string;

  @IsNotEmpty()
  serviceId: string;
}

export class DocumentUploadDto {
  @IsNotEmpty()
  submissionId: string;

  @IsNotEmpty()
  documentMasterId: string;

  @IsOptional()
  @IsString()
  serviceId?: string; // identifies the service when submission record may not exist (e.g. incentive)

  @IsOptional()
  @IsString()
  uploadType?: 'new' | 'duplicate';

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsOptional()
  @IsString()
  validTo?: string;

  @IsOptional()
  @IsString()
  docDateOfIssuance?: string;

  @IsOptional()
  @IsString()
  isDocumentActive?: string;
}

export class DocumentSyncDto {
  @IsNotEmpty()
  submissionId: string;

  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  deptId?: number;
}

export class FormBuilderUploadDto {
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  submissionId?: string;

  @IsOptional()
  @IsString()
  fieldCode?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  rowIndex?: string;
}
