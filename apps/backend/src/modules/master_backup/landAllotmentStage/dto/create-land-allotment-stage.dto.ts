import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateLandAllotmentStageDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
