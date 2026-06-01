import { PrismaClient } from '@prisma/client';
import { hsnCodesData } from './data/hsn-codes.data';

export async function seedHsnCodes(prisma: PrismaClient) {
  try {
    const result = await prisma.hsnCode.createMany({
      data: hsnCodesData,
      skipDuplicates: true,
    });

    const inserted = result.count;
    const skipped = Math.max(hsnCodesData.length - inserted, 0);
    console.log(`  ✅ HSN codes: inserted ${inserted}, skipped ${skipped}`);
  } catch (error) {
    console.error('  ❌ HSN code seeding failed:', error);
    throw error;
  }
}
