import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IncentiveApplicationFlowlogService } from './incentive-application-flowlog.service';
import { IncentiveApplicationFlowlogController } from './incentive-application-flowlog.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IncentiveApplicationFlowlogController],
  providers: [IncentiveApplicationFlowlogService],
  exports: [IncentiveApplicationFlowlogService],

})
export class IncentiveApplicationFlowlogModule {}
