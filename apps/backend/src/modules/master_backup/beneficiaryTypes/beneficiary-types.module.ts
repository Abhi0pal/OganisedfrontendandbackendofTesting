import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { BeneficiaryTypesService } from './beneficiary-types.service';
import { BeneficiaryTypesController } from './beneficiary-types.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BeneficiaryTypesController],
  providers: [BeneficiaryTypesService],
  exports: [BeneficiaryTypesService],
})
export class BeneficiaryTypesModule {}
