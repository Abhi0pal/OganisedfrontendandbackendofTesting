import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateFieldDto {
    @IsOptional()
    @IsString()
    field_code?: string;

    @IsOptional()
    @IsString()
    field_label?: string;

    @IsOptional()
    @IsString()
    data_type?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
