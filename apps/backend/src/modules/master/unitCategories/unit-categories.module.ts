import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UnitCategoriesService } from './unit-categories.service';
import { UnitCategoriesController } from './unit-categories.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UnitCategoriesController],
  providers: [UnitCategoriesService],
  exports: [UnitCategoriesService],
})
export class UnitCategoriesModule {}
