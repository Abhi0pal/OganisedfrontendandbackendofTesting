import { PrismaClient } from '@prisma/client';
import { beneficiaryTypesData } from './data/beneficiary-types.data';

export async function seedBeneficiaryTypes(prisma: PrismaClient) {
  try {
    const result = await prisma.beneficiaryTypes.createMany({
      data: beneficiaryTypesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Beneficiary Types records`);
  } catch (error) {
    console.error('❌ Beneficiary Types seeding failed:', error);
    throw error;
  }
}
