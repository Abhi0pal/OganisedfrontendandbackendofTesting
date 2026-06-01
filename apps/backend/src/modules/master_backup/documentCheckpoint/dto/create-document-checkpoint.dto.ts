import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateDocumentCheckpointDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  created?: string;

  @IsDateString()
  @IsOptional()
  modified?: string;

  @IsString()
  @IsOptional()
  filePath?: string;
}
