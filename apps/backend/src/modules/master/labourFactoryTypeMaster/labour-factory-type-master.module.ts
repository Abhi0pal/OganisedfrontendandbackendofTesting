import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { LabourFactoryTypeMasterController } from './labour-factory-type-master.controller';
import { LabourFactoryTypeMasterService } from './labour-factory-type-master.service';

@Module({
  imports: [PrismaModule],
  controllers: [LabourFactoryTypeMasterController],
  providers: [LabourFactoryTypeMasterService],
  exports: [LabourFactoryTypeMasterService],
})
export class LabourFactoryTypeMasterModule {}
