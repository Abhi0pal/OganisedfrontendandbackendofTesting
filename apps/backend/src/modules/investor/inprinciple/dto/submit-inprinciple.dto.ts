import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitInprincipleDto {
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

  // Existing investor flow: parent CAF submission id (SB selection)
  @IsOptional()
  @IsInt()
  parentSubId?: number;

  // Existing investor flow: CAF id to link in t_sp_applications
  @IsOptional()
  @IsInt()
  cafId?: number;

  // Existing investor flow: reuse SB ID (UBU ID)
  @IsOptional()
  @IsString()
  existingUbuId?: string;
}
