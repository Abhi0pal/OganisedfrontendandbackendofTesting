import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { PollutionControlEquipmentController } from './pollution-control-equipment.controller';
import { PollutionControlEquipmentService } from './pollution-control-equipment.service';

@Module({
  imports: [PrismaModule],
  controllers: [PollutionControlEquipmentController],
  providers: [PollutionControlEquipmentService],
  exports: [PollutionControlEquipmentService],
})
export class PollutionControlEquipmentModule {}
