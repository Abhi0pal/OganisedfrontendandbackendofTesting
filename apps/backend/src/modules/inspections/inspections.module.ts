import { Module } from '@nestjs/common';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import { AiModule } from '../../ai/ai.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [PrismaModule, AiModule],
    controllers: [InspectionsController],
    providers: [InspectionsService],
    exports: [InspectionsService],
})
export class InspectionsModule { }
