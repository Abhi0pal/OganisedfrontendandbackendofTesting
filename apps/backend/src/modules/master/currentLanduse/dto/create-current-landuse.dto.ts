import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateCurrentLanduseDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
