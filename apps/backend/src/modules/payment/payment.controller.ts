import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Public } from '../../common/public.decorator';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';

@Public()
@SkipResourceCheck()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('simulate')
  async simulatePayment(@Body() dto: { applicationId: number }) {
    return this.paymentService.simulatePayment(dto.applicationId);
  }

  @Get('details/:applicationId')
  async getPaymentDetails(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.paymentService.getPaymentDetails(applicationId);
  }
}
