import { IsString, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';

export class CreatePolicyDto {
    @IsInt()
    department_id: number;

    @IsString()
    policy_name: string;

    @IsString()
    policy_code: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    valid_from: string;

    @IsDateString()
    valid_to: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
