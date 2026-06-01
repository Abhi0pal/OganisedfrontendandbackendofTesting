import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

// Make all properties optional for update DTO
// Each field needs decorators so class-validator/class-transformer don't strip them
export class UpdateKyaQuestionDto {
    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @IsOptional()
    @IsString()
    questionLabel?: string;

    @IsOptional()
    @IsString()
    fieldType?: string;

    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    @IsBoolean()
    isDependent?: boolean;

    @Transform(({ value }) => value ? parseInt(value) : null)
    @IsOptional()
    parentQuestionId?: number | null;

    @Transform(({ value }) => value ? parseInt(value) : null)
    @IsOptional()
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
    userId?: number | null;

    @IsOptional()
    optionDetails?: any;
}
