import { IsString, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';

export class CreateMasterTableDto {
    @IsString()
    master_name: string;

    @IsString()
    master_code: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    table_name: string;

    @IsString()
    @IsOptional()
    schema_name?: string;

    @IsString()
    value_column: string;

    @IsString()
    label_column: string;

    @IsString()
    @IsOptional()
    secondary_label?: string;

    @IsString()
    @IsOptional()
    label_template?: string;

    @IsString()
    @IsOptional()
    is_active_column?: string;

    @IsString()
    @IsOptional()
    is_active_value?: string;

    @IsObject()
    @IsOptional()
    default_filter?: any;

    @IsString()
    @IsOptional()
    default_order_by?: string;

    @IsInt()
    @IsOptional()
    parent_master_id?: number;

    @IsString()
    @IsOptional()
    parent_column?: string;

    @IsString()
    @IsOptional()
    api_endpoint?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
