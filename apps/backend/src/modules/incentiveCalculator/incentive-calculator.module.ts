import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { IncentiveCalculatorService } from './incentive-calculator.service';
import { IncentiveCalculatorController } from './incentive-calculator.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IncentiveCalculatorController],
  providers: [IncentiveCalculatorService],
  exports: [IncentiveCalculatorService],
})
export class IncentiveCalculatorModule {}
