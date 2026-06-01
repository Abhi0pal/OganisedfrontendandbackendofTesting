import { PrismaClient } from '@prisma/client';
import { nicCodesData } from './data/nic-codes.data';

export async function seedNicCodes(prisma: PrismaClient) {
  try {
    const result = await prisma.nicCode.createMany({
      data: nicCodesData,
      skipDuplicates: true,
    });

    const inserted = result.count;
    const skipped = Math.max(nicCodesData.length - inserted, 0);
    console.log(`  ✅ NIC codes: inserted ${inserted}, skipped ${skipped}`);
  } catch (error) {
    console.error('  ❌ NIC code seeding failed:', error);
    throw error;
  }
}
