import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class ApplicationActionDto {
  @IsInt()
  submissionId: number;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  processingLevel?: string;

  @IsString()
  action:
    | 'forward'
    | 'approve'
    | 'reject'
    | 'revert'
    | 'hold'
    | 'FORWARD'
    | 'APPROVE'
    | 'REJECT'
    | 'REVERT_TO_INVESTOR'
    | 'HOLD'
    | 'FORWARD_TO_APPROVER';

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
  @IsObject()
  blockPayload?: Record<string, any>;
}
