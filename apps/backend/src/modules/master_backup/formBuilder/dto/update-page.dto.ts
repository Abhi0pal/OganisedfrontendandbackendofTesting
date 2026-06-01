import { IsOptional, IsString } from 'class-validator';

export class UpdatePageDto {
  @IsString()
  pageName!: string;

  @IsOptional()
  @IsString()
  nameInHindi?: string;
}