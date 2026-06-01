import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { MasterTablesService } from './master-tables.service';
import { MasterTablesController } from './master-tables.controller';

@Module({
    imports: [PrismaModule],
    controllers: [MasterTablesController],
    providers: [MasterTablesService],
    exports: [MasterTablesService],
})
export class MasterTablesModule { }
