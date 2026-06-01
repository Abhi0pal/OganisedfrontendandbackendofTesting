import { IsNotEmpty, IsString, IsNumber, IsObject, IsOptional } from 'class-validator';

export class SubmitApplicationDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsNotEmpty()
  @IsNumber()
  formTypeId: number;

  @IsNotEmpty()
  @IsObject()
  formData: Record<string, any>;

  @IsOptional()
  @IsString()
  cafId?: string;

  @IsOptional()
  @IsNumber()
  submissionId?: number;
}

export class DraftApplicationDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsNotEmpty()
  @IsNumber()
  formTypeId: number;

  @IsOptional()
  @IsString()
  cafId?: string;
}

export class SaveProgressDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsNotEmpty()
  @IsNumber()
  formTypeId: number;

  @IsNotEmpty()
  @IsObject()
  formData: Record<string, any>;

  @IsOptional()
  @IsString()
  cafId?: string;

  @IsOptional()
  @IsNumber()
  submissionId?: number;

  @IsOptional()
  @IsNumber()
  currentStep?: number;
}

export class FinalSubmitDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsNotEmpty()
  @IsNumber()
  formTypeId: number;

  @IsNotEmpty()
  @IsNumber()
  submissionId: number;
}
