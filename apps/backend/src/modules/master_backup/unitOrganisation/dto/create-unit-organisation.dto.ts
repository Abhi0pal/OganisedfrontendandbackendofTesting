import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUnitOrganisationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  educationIsActive?: boolean;
  
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  created?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  modified?: Date; 
}
