import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class CategoryInputDto {
  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsOptional()
  @IsString()
  helpText?: string;
}

export class SavePageCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryInputDto)
  categories!: CategoryInputDto[];
}