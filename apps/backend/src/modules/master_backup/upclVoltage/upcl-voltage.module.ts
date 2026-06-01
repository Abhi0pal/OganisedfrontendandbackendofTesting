import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UpclVoltageController } from './upcl-voltage.controller';
import { UpclVoltageService } from './upcl-voltage.service';

@Module({
  imports: [PrismaModule],
  controllers: [UpclVoltageController],
  providers: [UpclVoltageService],
  exports: [UpclVoltageService],
})
export class UpclVoltageModule {}
