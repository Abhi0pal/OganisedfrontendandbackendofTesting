import { IsBoolean, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateUnifiedApplicationDto {
  @IsInt()
  submissionId: number;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  formTypeId?: number;

  @IsOptional()
  @IsString()
  processingLevel?: string;

  @IsObject()
  formData: Record<string, any>;

  @IsOptional()
  @IsString()
  unitName?: string;

  @IsInt()
  districtId: number;

  @IsOptional()
  @IsString()
  cafType?: string;

  @IsOptional()
  @IsString()
  revertedCallBackUrl?: string;

  @IsOptional()
  @IsString()
  printAppCallBackUrl?: string;

  @IsOptional()
  @IsString()
  downloadCertificateCallBackUrl?: string;

  @IsOptional()
  @IsInt()
  currentStep?: number;

  @IsOptional()
  @IsBoolean()
  isFinalSubmit?: boolean;

  @IsOptional()
  @IsString()
  existingUbuId?: string;
}
