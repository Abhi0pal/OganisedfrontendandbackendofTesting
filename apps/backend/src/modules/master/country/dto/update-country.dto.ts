import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsNumber()
  boCountryId?: number;

  @IsOptional()
  @IsNumber()
  lrId?: number;

  @IsOptional()
  @IsNumber()
  hadbastNumber?: number;

  @IsOptional()
  @IsNumber()
  vtcCode?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
