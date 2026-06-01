import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { KyiIcCalculatorService } from './kyi-ic-calculator.service';
import { KyiIcCalculatorController } from './kyi-ic-calculator.controller';

@Module({
  imports: [PrismaModule],
  controllers: [KyiIcCalculatorController],
  providers: [KyiIcCalculatorService],
  exports: [KyiIcCalculatorService],
})
export class KyiIcCalculatorModule {}
