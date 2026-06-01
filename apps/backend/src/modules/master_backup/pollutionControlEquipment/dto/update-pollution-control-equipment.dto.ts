import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePollutionControlEquipmentDto {
  @IsOptional()
  @IsString()
  equipmentName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
