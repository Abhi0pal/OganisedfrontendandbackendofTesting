import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { KnowYourIncentiveService } from './know-your-incentive.service';
import { KnowYourIncentiveController } from './know-your-incentive.controller';

@Module({
  imports: [PrismaModule],
  controllers: [KnowYourIncentiveController],
  providers: [KnowYourIncentiveService],
  exports: [KnowYourIncentiveService],
})
export class KnowYourIncentiveModule {}