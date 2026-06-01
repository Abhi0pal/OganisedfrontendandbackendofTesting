import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IncentiveApplicationDocumentService } from './incentive-application-document.service';
import { IncentiveApplicationDocumentController } from './incentive-application-document.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IncentiveApplicationDocumentController],
  providers: [IncentiveApplicationDocumentService],
  exports: [IncentiveApplicationDocumentService],
})
export class IncentiveApplicationDocumentModule {}

