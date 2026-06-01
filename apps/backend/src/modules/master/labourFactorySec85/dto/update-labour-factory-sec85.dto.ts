import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateLabourFactorySec85Dto {
  @IsOptional()
  @IsString()
  specialProvisionName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
