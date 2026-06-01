
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { FormFieldService } from './form-field.service';
import { FormFieldController } from './form-field.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FormFieldController],
  providers: [FormFieldService],
  exports: [FormFieldService],
})
export class FormFieldModule {}
