import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class WorkflowSelectedRecipientDto {
  @IsInt()
  forwardedDeptId: number;

  @IsInt()
  nextRoleId: number;

  @IsInt()
  nextUserId: number;
}

export class WorkflowRuntimeActionDto {
  @IsInt()
  submissionId: number;

  @IsOptional()
  @IsInt()
  step?: number;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  processingLevel?: string;

  @IsString()
  action:
    | 'pending'
    | 'forward'
    | 'approve'
    | 'reject'
    | 'revert'
    | 'hold'
    | 'PENDING'
    | 'FORWARD'
    | 'APPROVE'
    | 'REJECT'
    | 'REVERT_TO_INVESTOR'
    | 'HOLD'
    | 'FORWARD_TO_APPROVER'
    | 'F'
    | 'FA'
    | 'RBI'
    | 'A'
    | 'R'
    | 'P'
    | 'H';

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsInt()
  nextRoleId?: number;

  @IsOptional()
  @IsArray()
  nextRoleIds?: number[];

  @IsOptional()
  @IsInt()
  nextUserId?: number;

  @IsOptional()
  @IsArray()
  nextUserIds?: number[];

  @IsOptional()
  @IsString()
  reasonForDelay?: string;

  @IsOptional()
  @IsString()
  supportiveDocument?: string;

  @IsOptional()
  @IsArray()
  forwardedDeptIds?: number[];

  @IsOptional()
  @IsInt()
  forwardedDistId?: number;

  @IsOptional()
  @IsInt()
  stateId?: number;

  @IsOptional()
  @IsObject()
  blockPayload?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowSelectedRecipientDto)
  selectedRecipients?: WorkflowSelectedRecipientDto[];
}
