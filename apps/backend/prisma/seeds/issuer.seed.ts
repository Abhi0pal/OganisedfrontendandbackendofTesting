import { PrismaClient } from '@prisma/client';
import { issuersData } from './data/issuers.data';

export async function seedIssuers(prisma: PrismaClient) {
  try {
    const existingIssuers = await prisma.issuer.count();

    if (existingIssuers > 0) {
      console.log('  ℹ️  Issuers already exist, skipping...');
      return;
    }

    console.log(`  📊 Seeding ${issuersData.length} issuers...`);

    let totalCreated = 0;

    for (const issuer of issuersData) {
      try {
        await prisma.issuer.create({
          data: issuer,
        });
        totalCreated++;
      } catch (error: any) {
        console.warn(
          `  ⚠️  Skipping issuer "${issuer.name}" - ${error.message}`
        );
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} issuers successfully`);
  } catch (error: any) {
    console.error('  ❌ Issuer seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}
