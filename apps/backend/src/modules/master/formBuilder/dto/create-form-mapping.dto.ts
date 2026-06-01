import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateFormMappingDto {
  @Expose({ name: 'form_type_id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  formTypeId!: number;

  @Expose({ name: 'form_name' })
  @IsString()
  formName!: string;

  @Expose({ name: 'form_code' })
  @IsString()
  formCode!: string;

  @Expose({ name: 'form_version' })
  @IsOptional()
  @IsString()
  formVersion?: string;

  @Expose({ name: 'tenant_id' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tenant_id?: number;

  @Expose({ name: 'project_id' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  project_id?: number;

  @Expose({ name: 'role_id' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  role_id?: number;
}