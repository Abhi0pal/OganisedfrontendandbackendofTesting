import { PrismaClient } from '@prisma/client';
import { villagesData } from './data/villages.data';

export async function seedVillages(prisma: PrismaClient) {
  try {
    const existingVillages = await prisma.village.count();

    if (existingVillages > 0) {
      console.log('  ℹ️  Villages already exist, skipping...');
      return;
    }

    // Get all existing tehsil IDs from database
    const tehsils = await prisma.tehsil.findMany({
      select: { id: true },
    });

    const validTehsilIds = new Set(tehsils.map((t) => t.id));

    console.log(`  📊 Found ${validTehsilIds.size} valid tehsil IDs in database`);

    // Filter villages to only include those with valid tehsil references
    const validVillages = villagesData.filter((village) => {
      if (!validTehsilIds.has(village.tehsilId)) {
        console.warn(
          `  ⚠️  Skipping village "${village.name}" - invalid tehsilId: ${village.tehsilId}`
        );
        return false;
      }
      return true;
    });

    console.log(
      `  ✓ Filtered: ${validVillages.length} valid villages out of ${villagesData.length}`
    );

    if (validVillages.length === 0) {
      console.log('  ⚠️  No valid villages found to seed!');
      return;
    }

    // Group villages by tehsilId for batch insertion
    const villagesByTehsil: { [key: number]: typeof validVillages } = {};

    for (const village of validVillages) {
      if (!villagesByTehsil[village.tehsilId]) {
        villagesByTehsil[village.tehsilId] = [];
      }
      villagesByTehsil[village.tehsilId].push(village);
    }

    let totalCreated = 0;
    let batchCount = 0;

    for (const tehsilId of Object.keys(villagesByTehsil)) {
      try {
        const result = await prisma.village.createMany({
          data: villagesByTehsil[parseInt(tehsilId)],
          skipDuplicates: true,
        });
        totalCreated += result.count;
        batchCount++;
      } catch (batchError: any) {
        console.error(
          `  ❌ Error seeding villages for tehsilId ${tehsilId}:`,
          batchError.message
        );
        // Continue with next batch instead of failing entirely
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} villages from ${batchCount} batches`);
  } catch (error: any) {
    console.error('  ❌ Village seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}
