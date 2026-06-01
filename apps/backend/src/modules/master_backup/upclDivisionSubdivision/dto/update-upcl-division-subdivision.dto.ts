import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUpclDivisionSubdivisionDto {
  @IsOptional()
  @IsString()
  divisionId?: string;

  @IsOptional()
  @IsString()
  divisionCode?: string;

  @IsOptional()
  @IsString()
  divisionName?: string;

  @IsOptional()
  @IsString()
  subdivisionId?: string;

  @IsOptional()
  @IsString()
  subdivisionCode?: string;

  @IsOptional()
  @IsString()
  subdivisionName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
