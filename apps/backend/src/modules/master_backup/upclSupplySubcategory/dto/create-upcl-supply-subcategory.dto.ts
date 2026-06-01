import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUpclSupplySubcategoryDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  supplyCategoryId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
