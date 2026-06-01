import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IncentiveApplicationSubmissionService } from './incentive-application-submission.service';
import { IncentiveApplicationSubmissionController } from './incentive-application-submission.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IncentiveApplicationSubmissionController],
  providers: [IncentiveApplicationSubmissionService],
  exports: [IncentiveApplicationSubmissionService],

})
export class IncentiveApplicationSubmissionModule {}
