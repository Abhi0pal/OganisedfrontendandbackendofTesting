import { Module } from '@nestjs/common';
import { KyaController } from './kya.controller';
import { KyaService } from './kya.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [KyaController],
    providers: [KyaService],
    exports: [KyaService],
})
export class KyaModule { }
