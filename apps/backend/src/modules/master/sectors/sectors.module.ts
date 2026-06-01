import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SectorsService } from './sectors.service';
import { SectorsController } from './sectors.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SectorsController],
  providers: [SectorsService],
  exports: [SectorsService],
})
export class SectorsModule {}
