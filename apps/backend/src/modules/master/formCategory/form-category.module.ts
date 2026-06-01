
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { FormCategoryService } from './form-category.service';
import { FormCategoryController } from './form-category.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FormCategoryController],
  providers: [FormCategoryService],
  exports: [FormCategoryService],
})
export class FormCategoryModule {}
