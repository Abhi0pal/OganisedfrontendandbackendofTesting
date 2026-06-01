import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateFieldDto {

    @IsString()
    field_code: string;

    @IsString()
    field_label: string;

    @IsString()
    data_type: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
