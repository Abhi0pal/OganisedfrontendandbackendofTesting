import { PrismaClient } from '@prisma/client';
import { districtsData } from './data/districts.data';

export async function seedDistricts(prisma: PrismaClient) {
  try {
    // Group districts by stateId for organized insertion
    const districtsByState: { [key: number]: typeof districtsData } = {};

    for (const district of districtsData) {
      if (!districtsByState[district.stateId]) {
        districtsByState[district.stateId] = [];
      }
      districtsByState[district.stateId].push(district);
    }

    let totalCreated = 0;
    for (const stateId of Object.keys(districtsByState)) {
      const result = await prisma.district.createMany({
        data: districtsByState[parseInt(stateId)],
        skipDuplicates: true,
      });
      totalCreated += result.count;
    }

    console.log(`  ✅ Seeded ${totalCreated} districts`);
  } catch (error) {
    console.error('  ❌ District seeding failed:', error);
    throw error;
  }
}