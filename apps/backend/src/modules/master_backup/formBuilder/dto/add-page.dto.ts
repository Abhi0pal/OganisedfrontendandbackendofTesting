import { IsOptional, IsString } from 'class-validator';

export class AddPageDto {
  @IsOptional()
  @IsString()
  pageName?: string;

  @IsOptional()
  @IsString()
  nameInHindi?: string;

  @IsOptional()
  @IsString()
  formCode?: string;
}