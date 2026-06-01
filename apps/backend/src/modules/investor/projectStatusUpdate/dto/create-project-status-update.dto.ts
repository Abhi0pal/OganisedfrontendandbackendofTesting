import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateProjectStatusUpdateDto {
  @IsInt()
  cafId: number;

  @IsOptional()
  @IsString()
  lastApprovalStatus?: string;

  @IsOptional()
  @IsString()
  trialProduction?: string;

  @IsOptional()
  @IsString()
  categoryA?: string;

  @IsOptional()
  @IsString()
  categoryB?: string;

  @IsOptional()
  @IsString()
  categoryC?: string;

  @IsOptional()
  @IsString()
  categoryD?: string;

  @IsOptional()
  @IsString()
  male?: string;

  @IsOptional()
  @IsString()
  female?: string;

  @IsOptional()
  @IsString()
  others?: string;

  @IsOptional()
  @IsString()
  totalEmployment?: string;

  @IsOptional()
  @IsDateString()
  commercialCommencementDate?: string;

  @IsOptional()
  @IsString()
  landType?: string;

  @IsOptional()
  @IsString()
  landAllotmentStage?: string;

  @IsOptional()
  @IsString()
  projectStatus?: string;

  @IsOptional()
  @IsString()
  currentStatus?: string;

  @IsOptional()
  @IsString()
  notImplementationReason?: string;

  @IsOptional()
  @IsString()
  droppedWithdrawnRemarks?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
