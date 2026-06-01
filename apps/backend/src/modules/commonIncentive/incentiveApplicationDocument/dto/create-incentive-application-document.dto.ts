import { IsInt, IsOptional, IsString, IsEnum } from "class-validator";
import {
  DocumentApproveStatus,
  DocumentStatusCommonIncentive,
} from "@prisma/client";

export class CreateIncentiveApplicationDocumentDto {
  @IsInt()
  userId!: number;

  @IsInt()
  applicationId!: number;

  @IsInt()
  documentId!: number;

  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  size!: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  deptRemarks?: string;

  @IsOptional()
  @IsEnum(DocumentStatusCommonIncentive)
  status?: DocumentStatusCommonIncentive; // default: Y

  @IsOptional()
  @IsInt()
  departmentUserId?: number;

  @IsOptional()
  @IsEnum(DocumentApproveStatus)
  approveStatus?: DocumentApproveStatus; // default: PENDING

  @IsInt()
  createdBy!: number;
}
