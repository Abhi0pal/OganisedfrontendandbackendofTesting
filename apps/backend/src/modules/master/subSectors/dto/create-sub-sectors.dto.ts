import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubSectorsDto {
  @IsString()
  name: string;

  @IsInt()
  sectorId: number;

  @Type(() => Date)
  @IsDate()
  effectiveFrom: Date;

  @Type(() => Date)
  @IsDate()
  effectiveTo: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
