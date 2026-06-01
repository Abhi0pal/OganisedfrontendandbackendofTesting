import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { MappingRegionCategoriesService } from './mapping-region-categories.service';
import { MappingRegionCategoriesController } from './mapping-region-categories.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MappingRegionCategoriesController],
  providers: [MappingRegionCategoriesService],
  exports: [MappingRegionCategoriesService],
})
export class MappingRegionCategoriesModule {}
