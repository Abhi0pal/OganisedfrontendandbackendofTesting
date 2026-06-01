import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateLandAllotmentStageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
