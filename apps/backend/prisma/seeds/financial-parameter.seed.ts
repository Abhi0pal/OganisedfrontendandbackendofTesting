import { PrismaClient } from '@prisma/client';
import { financialParameterData } from './data/financial-parameter.data';

export async function seedFinancialParameter(prisma: PrismaClient) {
  try {
    const result = await prisma.financialParameter.createMany({
      data: financialParameterData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Financial Parameter records`);
  } catch (error) {
    console.error('❌ Financial Parameter seeding failed:', error);
    throw error;
  }
}
