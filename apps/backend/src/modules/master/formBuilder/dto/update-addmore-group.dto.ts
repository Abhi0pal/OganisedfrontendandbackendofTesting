import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAddMoreGroupDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minRows?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxRows?: number;
}