import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCurrentLanduseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
