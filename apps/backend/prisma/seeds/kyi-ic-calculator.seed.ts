import { PrismaClient } from '@prisma/client';
import { kycIcCalculatorData } from './data/kyi-ic-calculator.data';

export async function seedKycIcCalculator(prisma: PrismaClient) {
  try {
    const result = await prisma.kyiIcCalculator.createMany({
      data: kycIcCalculatorData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} m_kyc_ic_calculator records`);
  } catch (error) {
    console.error('❌ m_kyc_ic_calculator seeding failed:', error);
    throw error;
  }
}
