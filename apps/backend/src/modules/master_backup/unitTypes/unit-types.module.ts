import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UnitTypesService } from './unit-types.service';
import { UnitTypesController } from './unit-types.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UnitTypesController],
  providers: [UnitTypesService],
  exports: [UnitTypesService],
})
export class UnitTypesModule {}
