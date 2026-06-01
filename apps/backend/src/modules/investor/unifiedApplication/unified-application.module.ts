import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UnifiedApplicationController } from './unified-application.controller';
import { UnifiedApplicationService } from './unified-application.service';
import { UnifiedDraftService } from './unified-draft.service';

@Module({
  imports: [PrismaModule],
  controllers: [UnifiedApplicationController],
  providers: [UnifiedApplicationService, UnifiedDraftService],
})
export class UnifiedApplicationModule {}
