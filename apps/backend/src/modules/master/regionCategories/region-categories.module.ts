import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { RegionCategoriesService } from './region-categories.service';
import { RegionCategoriesController } from './region-categories.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RegionCategoriesController],
  providers: [RegionCategoriesService],
  exports: [RegionCategoriesService],
})
export class RegionCategoriesModule {}
