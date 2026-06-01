import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateWorkflowActionMasterDto {
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

