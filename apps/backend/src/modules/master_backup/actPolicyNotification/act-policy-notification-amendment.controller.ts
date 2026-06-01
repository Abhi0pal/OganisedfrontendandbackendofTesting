import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ActPolicyNotificationAmendmentService } from './act-policy-notification-amendment.service';
import {
  CreateActPolicyNotificationAmendmentDto,
  UpdateActPolicyNotificationAmendmentDto,
} from './dto';
import { Public } from '../../../common/public.decorator';

@Public()
@Controller('master/act-policy-notification/:actPolicyNotificationId/amendments')
export class ActPolicyNotificationAmendmentController {
  constructor(
    private readonly service: ActPolicyNotificationAmendmentService,
  ) {}

  // ================= LIST =================
  @Get()
  findAll(@Param('actPolicyNotificationId') id: string) {
    return this.service.findAll(Number(id));
  }

  // ================= CREATE =================
  @Post()
  create(
    @Param('actPolicyNotificationId') id: string,
    @Body() dto: CreateActPolicyNotificationAmendmentDto,
  ) {
    return this.service.create(Number(id), dto);
  }

  // ================= UPDATE =================
  @Put(':amendmentId')
  update(
    @Param('amendmentId') amendmentId: string,
    @Body() dto: UpdateActPolicyNotificationAmendmentDto,
  ) {
    return this.service.update(Number(amendmentId), dto);
  }

  // ================= DELETE =================
  @Delete(':amendmentId')
  remove(@Param('amendmentId') amendmentId: string) {
    return this.service.delete(Number(amendmentId));
  }
}
