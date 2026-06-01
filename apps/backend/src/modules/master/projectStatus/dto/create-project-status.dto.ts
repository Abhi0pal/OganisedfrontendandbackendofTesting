import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateProjectStatusDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
