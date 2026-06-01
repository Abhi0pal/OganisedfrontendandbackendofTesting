import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateIssuerDto {
  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isIssuerActive?: boolean;
}
