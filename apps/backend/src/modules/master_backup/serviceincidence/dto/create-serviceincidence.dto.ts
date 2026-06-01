import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateServiceIncidenceDto {
  @IsString()
  name: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
