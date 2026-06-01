import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UpclSupplyCategoryController } from './upcl-supply-category.controller';
import { UpclSupplyCategoryService } from './upcl-supply-category.service';


@Module({
  imports: [PrismaModule],
  controllers: [UpclSupplyCategoryController],
  providers: [UpclSupplyCategoryService],
  exports: [UpclSupplyCategoryService],
})
export class UpclSupplyCategoryModule {}
