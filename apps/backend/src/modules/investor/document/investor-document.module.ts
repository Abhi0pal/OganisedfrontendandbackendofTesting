import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { InvestorDocumentService } from './investor-document.service';
import { InvestorDocumentController } from './investor-document.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InvestorDocumentController],
  providers: [InvestorDocumentService],
  exports: [InvestorDocumentService],
})
export class InvestorDocumentModule {}
