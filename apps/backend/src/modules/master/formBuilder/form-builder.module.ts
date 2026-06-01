import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { FormBuilderController } from './form-builder.controller';
import { FormBuilderService } from './form-builder.service';

@Module({
    imports: [PrismaModule],
    controllers: [FormBuilderController],
    providers: [FormBuilderService],
    exports: [FormBuilderService],
})
export class FormBuilderModule { }