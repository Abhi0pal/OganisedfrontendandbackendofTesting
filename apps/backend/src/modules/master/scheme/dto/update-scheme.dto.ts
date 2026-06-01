import { IsString, IsOptional, IsBoolean, IsInt, IsDateString, IsObject } from 'class-validator';

export class UpdateSchemeDto {
    @IsOptional()
    @IsInt()
    policy_id?: number;

    @IsOptional()
    @IsString()
    service_id?: string;

    @IsOptional()
    @IsString()
    scheme_name?: string;

    @IsOptional()
    @IsString()
    scheme_code?: string;

    @IsOptional()
    @IsObject()
    cascading_config?: any;

    @IsOptional()
    @IsObject()
    pop_message_config?: any;

    @IsOptional()
    @IsObject()
    form_structure_json?: any;

    @IsOptional()
    @IsObject()
    required_documents?: any;

    @IsOptional()
    @IsObject()
    calculation_logic?: any;

    @IsOptional()
    @IsObject()
    workflow_config?: any;

    @IsOptional()
    @IsObject()
    admin_view_config?: any;

    @IsOptional()
    @IsInt()
    version?: number;

    @IsOptional()
    @IsBoolean()
    is_current_version?: boolean;

    @IsOptional()
    @IsDateString()
    valid_from?: string;

    @IsOptional()
    @IsDateString()
    valid_to?: string;
}
