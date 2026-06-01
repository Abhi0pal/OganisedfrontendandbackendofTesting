import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateProjectStatusDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
