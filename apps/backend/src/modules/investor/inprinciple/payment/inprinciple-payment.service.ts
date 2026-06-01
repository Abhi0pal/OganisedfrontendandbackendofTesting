import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class InprinciplePaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaymentDetails(submissionId: number, userId: bigint) {
    const payments = await this.prisma.paymentDetail.findMany({
      where: {
        appSubId: submissionId,
        userId: Number(userId),
      },
      orderBy: { created: 'desc' },
    });
    return { payments };
  }

  async createPayment(options: {
    submissionId: number;
    userId: bigint;
    amount: number;
    paymentMode: string;
  }) {
    const now = new Date();
    const refNo = BigInt(Date.now());
    const orderId = BigInt(Date.now() + Math.floor(Math.random() * 1000));

    const created = await this.prisma.paymentDetail.create({
      data: {
        pgMeTrnRefNo: refNo,
        orderId,
        authNStatus: '',
        authZStatus: '',
        responseCode: '',
        bankReferenceBank: '',
        userId: Number(options.userId),
        applicationId: 1,
        appSubId: options.submissionId,
        amount: options.amount,
        surcharge: null,
        totalAmount: options.amount,
        trnReqDate: now.toISOString(),
        statusCode: 'F',
        statusDescription: 'Payment initiated',
        txnMsg: '',
        txnStatus: '',
        txnErrMsg: '',
        clntTxnRef: '',
        clntRqstMeta: '',
        worldlineMerchantTransactionId: '',
        hashToken: '',
        token: '',
        worldlineMerchantTransactionTime: now,
        paymentMode: options.paymentMode,
        created: now,
        updated: null,
      },
    });

    return created;
  }

  async updatePaymentStatus(options: {
    paymentId: number;
    userId: bigint;
    statusCode: 'S' | 'F';
  }) {
    const now = new Date();
    const success = options.statusCode === 'S';

    await this.prisma.paymentDetail.updateMany({
      where: {
        paymentId: BigInt(options.paymentId),
        userId: Number(options.userId),
      },
      data: {
        statusCode: options.statusCode,
        statusDescription: success ? 'Payment successful' : 'Payment failed',
        txnStatus: success ? 'SUCCESS' : 'FAILED',
        txnMsg: success ? 'Transaction successful' : 'Transaction failed',
        txnErrMsg: success ? '' : 'Payment failed',
        responseCode: success ? '00' : '01',
        authNStatus: success ? 'Y' : 'N',
        authZStatus: success ? 'Y' : 'N',
        bankReferenceBank: success ? String(Date.now()) : '',
        updated: now,
      },
    });
    const updated = await this.prisma.paymentDetail.findUnique({
      where: { paymentId: BigInt(options.paymentId) },
    });
    return updated;
  }

  async getLatestSuccessfulPayment(submissionId: number, userId: bigint) {
    const payment = await this.prisma.paymentDetail.findFirst({
      where: {
        appSubId: submissionId,
        userId: Number(userId),
        statusCode: 'S',
      },
      orderBy: { created: 'desc' },
    });
    return payment || null;
  }
}
