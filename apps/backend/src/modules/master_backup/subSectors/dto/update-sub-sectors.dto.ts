import { IsString, IsInt, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubSectorsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  sectorId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
