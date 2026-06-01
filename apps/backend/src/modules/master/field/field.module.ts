import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { FieldService } from './field.service';
import { FieldController } from './field.controller';

@Module({
    imports: [PrismaModule],
    controllers: [FieldController],
    providers: [FieldService],
    exports: [FieldService],
})
export class FieldModule { }
