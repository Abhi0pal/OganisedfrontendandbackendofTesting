import { IsInt, IsOptional, IsString, IsEnum } from "class-validator";
import {
  DocumentApproveStatus,
  DocumentStatusCommonIncentive,
} from "@prisma/client";

export class UpdateIncentiveApplicationDocumentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  size?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  deptRemarks?: string;

  @IsOptional()
  @IsEnum(DocumentStatusCommonIncentive)
  status?: DocumentStatusCommonIncentive;

  @IsOptional()
  @IsInt()
  departmentUserId?: number;

  @IsOptional()
  @IsEnum(DocumentApproveStatus)
  approveStatus?: DocumentApproveStatus;

  @IsOptional()
  @IsInt()
  modifiedBy?: number;
}
