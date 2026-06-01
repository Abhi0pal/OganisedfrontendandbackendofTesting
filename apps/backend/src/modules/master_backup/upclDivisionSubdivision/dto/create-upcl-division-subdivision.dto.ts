import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUpclDivisionSubdivisionDto {
  @IsString()
  divisionId: string;

  @IsString()
  divisionCode: string;

  @IsString()
  divisionName: string;

  @IsString()
  subdivisionId: string;

  @IsString()
  subdivisionCode: string;

  @IsString()
  subdivisionName: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
