import { IsInt, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateServiceDetailDto {
    @IsOptional()
    @IsString()
    serviceCategory?: string;

    @IsOptional()
    @IsString()
    authorityName?: string;

    @Transform(({ value }) => (value ? parseInt(value) : null))
    @IsOptional()
    @IsInt()
    timeline?: number;

    @IsOptional()
    @IsString()
    sopDocument?: string;

    @IsOptional()
    @IsString()
    feeStructureDocument?: string;

    @IsOptional()
    @IsString()
    listOfRequiredDocuments?: string;
}
