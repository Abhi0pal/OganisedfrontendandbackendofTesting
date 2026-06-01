import { IsString, IsOptional, IsInt, IsObject } from 'class-validator';

export class StartWorkflowDto {
  @IsInt()
  departmentId: number;

  @IsString()
  serviceId: string;

  @IsString()
  applicationId: string; // will be converted to BigInt
}

export class ExecuteActionDto {
  @IsString()
  forwardLevelId: string; // will be converted to BigInt

  @IsString()
  actionCode: string;

  @IsOptional()
  @IsInt()
  actorRoleId?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsObject()
  applicationData?: Record<string, any>;
}
