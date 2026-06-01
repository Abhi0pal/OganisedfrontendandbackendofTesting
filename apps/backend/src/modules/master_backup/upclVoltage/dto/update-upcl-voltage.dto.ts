import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUpclVoltageDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  voltageGroup?: string;

  @IsOptional()
  @IsString()
  voltageDesc?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
