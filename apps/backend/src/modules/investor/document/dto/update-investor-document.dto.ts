import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export class UpdateInvestorDocumentDto {
  @IsOptional()
  @IsString()
  documentName?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsDateString()
  documentDateOfIssuance?: string;

  @IsOptional()
  @IsEnum(['U', 'V', 'R', 'M'])
  documentStatus?: 'U' | 'V' | 'R' | 'M';

  /** ✅ Needed by service update to replace file path */
  @IsOptional()
  @IsString()
  documentPath?: string;
}
