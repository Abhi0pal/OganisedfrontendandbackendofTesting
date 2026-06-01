import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateFormTypeDto {
  @IsString()
  name: string;

  @IsString()
  abbr: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
