import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { SsoService } from './sso.service';
import { DeptWebhookUpdateStatusDto } from './dto/dept-webhook-update-status.dto';

@Controller('dept/webhook')
export class DeptWebhookController {
  constructor(private readonly sso: SsoService) {}

  /**
   * Inbound status updates from departments
   * Optional shared token security via X-Shared-Token header
   */
  @Post('update-status')
  async inboundUpdateStatus(
    @Body() dto: DeptWebhookUpdateStatusDto,
    @Headers('x-shared-token') sharedToken: string | undefined,
    @Req() req: any,
  ) {
    return this.sso.handleWebhookUpdateStatus(dto, sharedToken, req);
  }
}
