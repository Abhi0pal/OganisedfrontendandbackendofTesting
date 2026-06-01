
import { IsString, IsObject } from 'class-validator';

export class DeptWebhookUpdateStatusDto {
  @IsString()
  dept_tag: string; // Department.uniqueTag for logging and routing

  @IsObject()
  payload: Record<string, any>;
}
