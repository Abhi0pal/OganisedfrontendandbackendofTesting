import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateNicCodeDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  nicIiDigit?: string;

  @IsOptional()
  @IsString()
  nicIvDigit?: string;

  @IsOptional()
  @IsString()
  nicVDigit?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
