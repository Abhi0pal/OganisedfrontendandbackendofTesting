import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { InvestorDocumentUploadService } from './services/investor-document-upload.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UploadController],
  providers: [InvestorDocumentUploadService],
  exports: [InvestorDocumentUploadService],
})
export class UploadModule {}