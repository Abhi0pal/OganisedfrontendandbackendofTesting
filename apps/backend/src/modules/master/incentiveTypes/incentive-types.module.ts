import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IncentiveTypesService } from './incentive-types.service';
import { IncentiveTypesController } from './incentive-types.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IncentiveTypesController],
  providers: [IncentiveTypesService],
  exports: [IncentiveTypesService],
})
export class IncentiveTypesModule {}
