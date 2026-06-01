import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ActPolicyNotificationController } from './act-policy-notification.controller';
import { ActPolicyNotificationService } from './act-policy-notification.service';
import { ActPolicyNotificationAmendmentController } from './act-policy-notification-amendment.controller';
import { ActPolicyNotificationAmendmentService } from './act-policy-notification-amendment.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActPolicyNotificationController, ActPolicyNotificationAmendmentController,],
  providers: [ActPolicyNotificationService , ActPolicyNotificationAmendmentService],
  exports: [ActPolicyNotificationService , ActPolicyNotificationAmendmentService]
})
export class ActPolicyNotificationModule {}
