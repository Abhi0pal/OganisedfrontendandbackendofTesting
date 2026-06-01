import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateLabourFactorySec85Dto {
  @IsNumber()
  id: number;

  @IsString()
  specialProvisionName: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
