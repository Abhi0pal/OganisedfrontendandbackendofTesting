import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateUjsDivisionDto {
  @IsNumber()
  divisionId: number;

  @IsString()
  officeName: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
