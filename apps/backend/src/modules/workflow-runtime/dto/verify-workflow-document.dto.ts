import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class VerifyWorkflowDocumentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  submissionId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  documentsId: number;

  @IsString()
  @IsIn(['V', 'U', 'R', 'M'])
  status: 'V' | 'U' | 'R' | 'M';

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  @IsIn(['0', '1'])
  isDraft?: '0' | '1';

  @IsOptional()
  @IsString()
  serviceId?: string; // required by some flows (e.g. incentive) when submission table is absent
}

