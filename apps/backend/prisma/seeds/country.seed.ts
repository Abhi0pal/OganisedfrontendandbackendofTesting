import { PrismaClient } from '@prisma/client';
import { countriesData } from './data/countries.data';

export async function seedCountries(prisma: PrismaClient) {
  try {
    const result = await prisma.country.createMany({
      data: countriesData,
      skipDuplicates: true,
    });

    console.log(`  ✅ Seeded ${result.count} countries`);
  } catch (error) {
    console.error('  ❌ Country seeding failed:', error);
    throw error;
  }
}
