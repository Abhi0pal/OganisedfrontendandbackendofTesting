import { Module } from '@nestjs/common';
import { DocumentMasterService } from './document-master.service';
import { DocumentMasterController } from './document-master.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentMasterController],
  providers: [DocumentMasterService],
  exports: [DocumentMasterService],
})
export class DocumentMasterModule {}
