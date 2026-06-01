import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateDocumentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsBoolean()
  isDocActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFormatRequired?: boolean;
}
