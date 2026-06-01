import { Module } from '@nestjs/common';
import { IncentiveApplicationDocumentModule } from './incentiveApplicationDocument/incentive-application-document.module';
import { IncentiveApplicationFlowlogModule } from './incentiveApplicationFlowlog/incentive-application-flowlog.module';
import { IncentiveApplicationSubmissionModule } from './incentiveApplicationSubmission/incentive-application-submission.module';


@Module({

  imports: [
    IncentiveApplicationDocumentModule,
    IncentiveApplicationFlowlogModule,
    IncentiveApplicationSubmissionModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class CommonIncentiveModule {}
