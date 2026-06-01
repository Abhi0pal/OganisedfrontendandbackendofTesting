import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreatePollutionControlEquipmentDto {
  @IsNumber()
  id: number;

  @IsString()
  equipmentName: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
