import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { LandAllotmentStageController } from './land-allotment-stage.controller';
import { LandAllotmentStageService } from './land-allotment-stage.service';

@Module({
  imports: [PrismaModule],
  controllers: [LandAllotmentStageController],
  providers: [LandAllotmentStageService],
  exports: [LandAllotmentStageService],
})
export class LandAllotmentStageModule {}
