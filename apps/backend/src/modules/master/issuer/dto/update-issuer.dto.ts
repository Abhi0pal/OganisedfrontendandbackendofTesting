import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateIssuerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isIssuerActive?: boolean;
}
