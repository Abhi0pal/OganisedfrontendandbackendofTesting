import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProcessNodeType, AssigneeType, SlaBreach } from '@prisma/client';

export class CreateWorkflowDefDto {
  @IsOptional()
  @IsInt()
  tenantId?: number;

  @IsInt()
  departmentId: number;

  @IsOptional()
  @IsInt()
  subDepartmentId?: number;

  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsInt()
  moduleId?: number;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWorkflowDefDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class BulkSaveCanvasDto {
  @IsInt()
  workflowDefId: number;

  @IsArray()
  nodes: any[];

  @IsArray()
  edges: any[];
  
  @IsOptional()
  @IsArray()
  forkJoins?: any[];
}
