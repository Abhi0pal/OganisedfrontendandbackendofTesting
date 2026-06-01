import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateUjsDivisionDto {
  @IsOptional()
  @IsNumber()
  divisionId?: number;

  @IsOptional()
  @IsString()
  officeName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
