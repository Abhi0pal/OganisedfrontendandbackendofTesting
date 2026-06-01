import { IsString, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOccurrencesDto {
  @IsOptional()
  @IsString()
  name?: string;

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
