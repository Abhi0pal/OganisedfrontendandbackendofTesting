import { IsOptional, IsString } from 'class-validator';

export class RoleDashboardQueryDto {
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  deptId?: string;

  @IsOptional()
  @IsString()
  statuses?: string;

  @IsOptional()
  @IsString()
  processingLevel?: string;
}
