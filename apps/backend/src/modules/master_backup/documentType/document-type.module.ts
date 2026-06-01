import { Module } from '@nestjs/common';
import { DocumentTypeService } from './document-type.service';
import { DocumentTypeController } from './document-type.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentTypeController],
  providers: [DocumentTypeService],
  exports: [DocumentTypeService],
})
export class DocumentTypeModule {}
