import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateFormTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbr?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
