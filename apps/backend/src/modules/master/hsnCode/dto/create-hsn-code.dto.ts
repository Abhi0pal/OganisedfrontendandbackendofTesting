import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateHsnCodeDto {
  @IsNumber()
  id: number;

  @IsString()
  hsnCode: string;

  @IsString()
  commodityName: string;

  @IsOptional()
  @IsString()
  gstRate?: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
