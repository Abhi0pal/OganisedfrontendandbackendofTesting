import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateFormMappingDto {
  @IsInt()
  @Min(1)
  formTypeId!: number;

  @IsString()
  formName!: string;

  @IsString()
  formCode!: string;

  @IsOptional()
  @IsString()
  formVersion?: string;
}