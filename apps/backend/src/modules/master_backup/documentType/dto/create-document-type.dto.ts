import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDocumentTypeDto {
  @IsString()
  name: string;

  @IsString()
  abbreviation: string;

  @IsBoolean()
  @IsOptional()
  isDocActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isFormatRequired?: boolean;
}
