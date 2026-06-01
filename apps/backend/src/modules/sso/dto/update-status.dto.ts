
import { IsString, IsObject } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  dept_tag: string;

  @IsObject()
  payload: Record<string, any>;
}
