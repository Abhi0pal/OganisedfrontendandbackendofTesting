import { IsString, IsOptional, IsBoolean, IsInt, IsDateString, IsObject, IsArray } from 'class-validator';

export class CreateSchemeDto {
    @IsInt()
    policy_id: number;

    @IsString()
    service_id: string;

    @IsString()
    scheme_name: string;

    @IsString()
    scheme_code: string;

    @IsOptional()
    cascading_config?: any;

    @IsOptional()
    pop_message_config?: any;

    @IsOptional()
    form_structure_json?: any;

    @IsOptional()
    required_documents?: any;

    @IsOptional()
    calculation_logic?: any;

    @IsOptional()
    workflow_config?: any;

    @IsOptional()
    admin_view_config?: any;

    @IsOptional()
    @IsInt()
    version?: number;

    @IsOptional()
    @IsBoolean()
    is_current_version?: boolean;

    @IsDateString()
    valid_from: string;

    @IsDateString()
    valid_to: string;
}
