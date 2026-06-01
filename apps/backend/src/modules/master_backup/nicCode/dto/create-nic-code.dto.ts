import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateNicCodeDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  nicIiDigit?: string;

  @IsOptional()
  @IsString()
  nicIvDigit?: string;

  @IsOptional()
  @IsString()
  nicVDigit?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
