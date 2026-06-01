import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class ForwardPreviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  submissionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  appSubId?: number;

  @Type(() => Number)
  @IsInt()
  step: number;

  @IsIn(['FORWARD', 'F'])
  action: 'FORWARD' | 'F';

  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  departmentIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  forwardedDeptIds?: number[];

  @IsOptional()
  @IsString()
  jurisdictionLevel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  forwardedDistId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stateId?: number;
}
