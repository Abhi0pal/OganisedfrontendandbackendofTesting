import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { YnFlag } from '@prisma/client';

export class CreateRuleDto {
  @IsString()
  scope: string; // FIELD | SECTION | OPTIONS | DOCUMENT

  @IsObject()
  whenJson: any;

  @IsObject()
  thenJson: any;

  @IsOptional()
  @IsEnum(YnFlag)
  isActive?: YnFlag;
}

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsObject()
  whenJson?: any;

  @IsOptional()
  @IsObject()
  thenJson?: any;

  @IsOptional()
  @IsEnum(YnFlag)
  isActive?: YnFlag;
}
