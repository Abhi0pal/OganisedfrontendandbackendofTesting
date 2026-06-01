import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SchemeService } from './scheme.service';
import { SchemeController } from './scheme.controller';

@Module({
    imports: [PrismaModule],
    controllers: [SchemeController],
    providers: [SchemeService],
    exports: [SchemeService],
})
export class SchemeModule { }
