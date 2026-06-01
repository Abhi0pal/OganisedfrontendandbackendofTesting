import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateServiceSectorDto {
  @IsString()
  name: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}