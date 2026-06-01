import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { MsmeYearService } from './msme-year.service';
import { MsmeYearController } from './msme-year.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MsmeYearController],
  providers: [MsmeYearService],
  exports: [MsmeYearService],
})
export class MsmeYearModule {}
