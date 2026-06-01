import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateHsnCodeDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  @IsString()
  commodityName?: string;

  @IsOptional()
  @IsString()
  gstRate?: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
