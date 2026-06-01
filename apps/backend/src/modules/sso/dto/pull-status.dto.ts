
import { IsString } from 'class-validator';

export class PullStatusDto {
  @IsString()
  dept_tag: string;

  @IsString()
  app_id: string;

  @IsString()
  service_id: string;

  @IsString()
  in_principle_id: string;
}
