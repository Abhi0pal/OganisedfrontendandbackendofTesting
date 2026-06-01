import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateServicetypeDto {
  @IsString()
  name: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
