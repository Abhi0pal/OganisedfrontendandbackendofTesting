import { Module } from '@nestjs/common';
import { InprincipleController } from './inprinciple.controller';
import { InprincipleService } from './inprinciple.service';
import { PrismaService } from '../../database/prisma.service';
import { InprincipleHistoryService } from './history/inprinciple-history.service';
import { InprincipleDraftService } from './draft/inprinciple-draft.service';
import { InprinciplePaymentService } from './payment/inprinciple-payment.service';
import { WorkflowRuntimeModule } from '../../workflow-runtime/workflow-runtime.module';

@Module({
  imports: [WorkflowRuntimeModule],
  controllers: [InprincipleController],
  providers: [
    InprincipleService,
    InprincipleHistoryService,
    InprincipleDraftService,
    InprinciplePaymentService,
    PrismaService,
  ],
})
export class InprincipleModule {}
