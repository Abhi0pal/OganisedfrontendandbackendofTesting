import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { LandCategoriesService } from './land-categories.service';
import { LandCategoriesController } from './land-categories.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LandCategoriesController],
  providers: [LandCategoriesService],
  exports: [LandCategoriesService],
})
export class LandCategoriesModule {}
