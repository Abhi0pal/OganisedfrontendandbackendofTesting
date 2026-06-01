
import { IsString } from 'class-validator';

export class InitiateSsoDto {
  @IsString()
  dept_tag: string;

  @IsString()
  service_id: string;

  @IsString()
  caf_id: string;

  @IsString()
  app_id: string;

  @IsString()
  uid: string;
}
