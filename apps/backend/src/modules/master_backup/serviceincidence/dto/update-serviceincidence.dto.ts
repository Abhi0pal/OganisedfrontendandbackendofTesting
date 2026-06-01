import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateServiceIncidenceDto {
  @IsString()
  name: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}