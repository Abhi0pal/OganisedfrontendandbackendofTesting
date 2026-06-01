
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { DocumentTypeModule } from './document-type.module';
import { DocumentTypePublicController } from './document-type.public.controller';

// This module only exists to publish the root /document-types endpoints
@Module({
  imports: [PrismaModule, DocumentTypeModule],
  controllers: [DocumentTypePublicController],
})
export class DocumentTypeRootModule {}
