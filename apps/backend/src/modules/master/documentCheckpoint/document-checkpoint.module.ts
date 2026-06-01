import { Module } from '@nestjs/common';
import { DocumentCheckpointService } from './document-checkpoint.service';
import { DocumentCheckpointController } from './document-checkpoint.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentCheckpointController],
  providers: [DocumentCheckpointService],
  exports: [DocumentCheckpointService],
})
export class DocumentCheckpointModule {}
