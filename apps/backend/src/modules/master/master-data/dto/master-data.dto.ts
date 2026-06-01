import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class CreateMasterDataDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  abbr?: string;

  @IsInt()
  master_definition_id: number;

  @IsOptional()
  json_definition?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateMasterDataDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbr?: string;

  @IsOptional()
  json_definition?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
