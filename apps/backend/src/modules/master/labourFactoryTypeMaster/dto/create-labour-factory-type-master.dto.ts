import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateLabourFactoryTypeMasterDto {
  @IsNumber()
  id: number;

  @IsString()
  factoryType: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
