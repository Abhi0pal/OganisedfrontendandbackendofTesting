import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { LabourFactorySec85Controller } from './labour-factory-sec85.controller';
import { LabourFactorySec85Service } from './labour-factory-sec85.service';

@Module({
  imports: [PrismaModule],
  controllers: [LabourFactorySec85Controller],
  providers: [LabourFactorySec85Service],
  exports: [LabourFactorySec85Service],
})
export class LabourFactorySec85Module {}
