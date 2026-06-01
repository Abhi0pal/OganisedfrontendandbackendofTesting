import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WorkflowRuntimeModule)],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
