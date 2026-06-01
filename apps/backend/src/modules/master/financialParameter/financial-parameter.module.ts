import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { FinancialParameterService } from './financial-parameter.service';
import { FinancialParameterController } from './financial-parameter.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialParameterController],
  providers: [FinancialParameterService],
  exports: [FinancialParameterService],
})
export class FinancialParameterModule {}
