import { IsString, IsInt, IsBoolean, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class InspectionChecklistItemDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    type: string; // 'PHOTO', 'VIDEO', 'DOCUMENT', 'TEXT'

    @IsBoolean()
    @IsOptional()
    isMandatory?: boolean;

    @IsString()
    @IsOptional()
    riskIndicator?: string;

    @IsOptional()
    validationRules?: any;
}

export class CreateInspectionChecklistDto {
    @IsInt()
    serviceId: number;

    @IsString()
    @IsOptional()
    version?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InspectionChecklistItemDto)
    items: InspectionChecklistItemDto[];
}
