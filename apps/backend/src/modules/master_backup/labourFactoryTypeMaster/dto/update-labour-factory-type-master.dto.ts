import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateLabourFactoryTypeMasterDto {
  @IsOptional()
  @IsString()
  factoryType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
