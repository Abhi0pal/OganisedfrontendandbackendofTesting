import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInformationWizardDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceId?: number;

  @IsOptional()
  @IsString()
  statuaryFormPath?: string;

  @IsOptional()
  @IsString()
  feeStructurePath?: string;

  @IsOptional()
  @IsString()
  sopDocumentPath?: string;

  @IsOptional()
  @IsString()
  stageWiseTimelinePath?: string;

  @IsOptional()
  @IsString()
  statuaryTimelinePath?: string;

  @IsOptional()
  @IsString()
  statuaryTimelineText?: string;

  @IsOptional()
  @IsString()
  inspectionChecklistPath?: string;

  @IsOptional()
  @IsString()
  riskCategory?: string;

  @IsOptional()
  @IsString()
  sizeOfFirm?: string;

  @IsOptional()
  @IsString()
  businessLocation?: string;

  @IsOptional()
  @IsString()
  investorType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
