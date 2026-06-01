import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUpclSupplySubcategoryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  supplyCategoryId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
