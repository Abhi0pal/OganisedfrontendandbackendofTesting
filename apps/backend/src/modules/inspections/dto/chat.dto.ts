import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
    @IsString()
    role: 'user' | 'model';

    @IsString()
    text: string;
}

export class ChatDto {
    @IsString()
    message: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChatMessageDto)
    @IsOptional()
    history?: ChatMessageDto[];

    @IsString()
    @IsOptional()
    context?: string;
}
