import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateWorkflowAssignmentStrategyDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

