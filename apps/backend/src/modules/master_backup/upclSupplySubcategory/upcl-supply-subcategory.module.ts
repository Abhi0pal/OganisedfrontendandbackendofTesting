import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UpclSupplySubcategoryController } from './upcl-supply-subcategory.controller';
import { UpclSupplySubcategoryService } from './upcl-supply-subcategory.service';

@Module({
  imports: [PrismaModule],
  controllers: [UpclSupplySubcategoryController],
  providers: [UpclSupplySubcategoryService],
  exports: [UpclSupplySubcategoryService],
})
export class UpclSupplySubcategoryModule {}
