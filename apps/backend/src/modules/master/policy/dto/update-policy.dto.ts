import { IsString, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';

export class UpdatePolicyDto {
    @IsOptional()
    @IsInt()
    department_id?: number;

    @IsOptional()
    @IsString()
    policy_name?: string;

    @IsOptional()
    @IsString()
    policy_code?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    valid_from?: string;

    @IsOptional()
    @IsDateString()
    valid_to?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
