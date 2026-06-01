import { PrismaClient } from '@prisma/client';
import { paymentDetailData } from './data/payment-detail.data';

export async function seedPaymentDetail(prisma: PrismaClient) {
  try {
    const result = await prisma.paymentDetail.createMany({
      data: paymentDetailData,
      skipDuplicates: true,
    });

    const inserted = result.count;
    const skipped = Math.max(paymentDetailData.length - inserted, 0);
    console.log(`  [OK] Payment detail: inserted ${inserted}, skipped ${skipped}`);
  } catch (error) {
    console.error('  [ERROR] Payment detail seeding failed:', error);
    throw error;
  }
}
