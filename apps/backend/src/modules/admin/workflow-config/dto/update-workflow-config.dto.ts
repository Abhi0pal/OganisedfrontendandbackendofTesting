import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateWorkflowConfigDto {
  @IsOptional()
  @IsInt()
  step?: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsInt()
  configVersion?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  startDate?: Date | string;

  @IsOptional()
  endDate?: Date | string | null;

  @IsOptional()
  @IsInt()
  roleId?: number;

  @IsOptional()
  @IsInt()
  jurisdictionLevelId?: number;

  @IsOptional()
  @IsInt()
  assignmentStrategyId?: number;

  @IsOptional()
  @IsObject()
  assignmentRuleJson?: Record<string, any> | null;

  @IsOptional()
  @IsArray()
  actionMasterIds?: number[];

  @IsOptional()
  @IsArray()
  actionAllowedJson?: string[]; // backward compatibility

  @IsOptional()
  @IsObject()
  transitionMapJson?: Record<string, any>;

  @IsOptional()
  @IsInt()
  slaHours?: number;

  @IsOptional()
  @IsBoolean()
  slaBreachRequiresReason?: boolean;

  @IsOptional()
  @IsInt()
  nextAllocationRoleId?: number | null;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  processingLevel?: string;

  @IsOptional()
  @IsInt()
  currentRoleId?: number;

  @IsOptional()
  @IsInt()
  formTypeId?: number;

  @IsOptional()
  @IsInt()
  nextRoleId?: number;

  @IsOptional()
  @IsInt()
  approverId?: number;

  @IsOptional()
  @IsInt()
  forwardRoleId?: number;

  @IsOptional()
  @IsInt()
  revertRoleId?: number;

  @IsOptional()
  @IsString()
  isDelayReasonRequired?: string;

  @IsOptional()
  @IsString()
  timeInHours?: string;

  @IsOptional()
  @IsString()
  canRevertToInvestor?: string;

  @IsOptional()
  @IsString()
  canVerifyDocument?: string;

  @IsOptional()
  @IsString()
  canForwardToMultipleRoleId?: string;

  @IsOptional()
  @IsString()
  canForwardToMultipleUserId?: string;

  @IsOptional()
  @IsString()
  isOwnDepartment?: string;

  @IsOptional()
  @IsString()
  permissableTabFormId?: string;

  @IsOptional()
  @IsString()
  documentShowLast?: string;

  @IsOptional()
  @IsString()
  processAnytime?: string;

  @IsOptional()
  @IsString()
  showLiceneceList?: string;

  @IsOptional()
  @IsString()
  showFieldEditableOrNot?: string;

  @IsOptional()
  @IsString()
  formServiceJs?: string;

  @IsOptional()
  @IsString()
  formActionController?: string;

  @IsOptional()
  @IsString()
  subformActionName?: string;

  @IsOptional()
  @IsString()
  licenceNumberFormat?: string;
}
