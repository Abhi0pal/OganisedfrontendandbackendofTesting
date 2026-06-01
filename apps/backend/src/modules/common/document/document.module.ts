import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CommonDocumentService } from './document.service';
import { CommonDocumentController } from './document.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CommonDocumentController],
  providers: [CommonDocumentService],
  exports: [CommonDocumentService],
})
export class CommonDocumentModule {}
