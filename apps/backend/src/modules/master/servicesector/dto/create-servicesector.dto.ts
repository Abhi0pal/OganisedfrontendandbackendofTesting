import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateServiceSectorDto {
  @IsString()
  name: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
