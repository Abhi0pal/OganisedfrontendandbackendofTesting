import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class UpdateDocumentCheckpointDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  created?: string;

  @IsOptional()
  @IsDateString()
  modified?: string;

  @IsOptional()
  @IsString()
  filePath?: string;
}
