import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class SaveUnifiedApplicationDto {
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
  @IsInt()
  parentSubId?: number;

  @IsOptional()
  @IsInt()
  cafId?: number;

  @IsOptional()
  @IsString()
  existingUbuId?: string;
}
