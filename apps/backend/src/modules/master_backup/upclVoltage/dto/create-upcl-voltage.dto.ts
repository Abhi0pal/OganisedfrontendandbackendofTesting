import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUpclVoltageDto {
  @IsString()
  id: string;

  @IsString()
  voltageGroup: string;

  @IsString()
  voltageDesc: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
