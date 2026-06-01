import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { DistrictService } from './district.service';
import { DistrictController } from './district.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DistrictController],
  providers: [DistrictService],
  exports: [DistrictService],
})
export class DistrictModule {}