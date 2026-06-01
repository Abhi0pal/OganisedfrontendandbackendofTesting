import { IsString, IsInt, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class OptionDetailDto {
    @IsOptional()
    @IsInt()
    id?: number;

    @IsString()
    option_label: string;

    @IsOptional()
    @IsArray()
    approvals?: number[];
}

export class CreateKyaQuestionDto {
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    categoryId: number;

    @IsString()
    questionLabel: string;

    @IsString()
    fieldType: string;

    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    @IsBoolean()
    isDependent?: boolean;

    @Transform(({ value }) => value ? parseInt(value) : null)
    @IsOptional()
    @IsInt()
    parentQuestionId?: number | null;

    @Transform(({ value }) => value ? parseInt(value) : null)
    @IsOptional()
    @IsInt()
    kyaOptionId?: number | null;

    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    @IsBoolean()
    isMandatory?: boolean;

    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    @IsBoolean()
    isTooltipAvailable?: boolean;

    @IsOptional()
    @IsString()
    tooltipText?: string;

    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    @IsBoolean()
    showReferenceDocument?: boolean;

    @IsOptional()
    @IsString()
    urlDocument?: string;

    @Transform(({ value }) => value ? parseInt(value) : null)
    @IsOptional()
    @IsInt()
    userId?: number | null;

    @IsOptional()
    optionDetails?: OptionDetailDto[] | string;
}
