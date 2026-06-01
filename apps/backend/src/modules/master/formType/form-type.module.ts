import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { FormTypeController } from './form-type.controller';
import { FormTypeService } from './form-type.service';

@Module({
  imports: [PrismaModule],
  controllers: [FormTypeController],
  providers: [FormTypeService],
  exports: [FormTypeService],
})
export class FormTypeModule {}
