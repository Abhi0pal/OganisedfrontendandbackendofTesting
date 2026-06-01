import { PrismaClient } from '@prisma/client';
import { tehsilsData } from './data/tehsils.data';

export async function seedTehsils(prisma: PrismaClient) {
  try {
    const existingTehsils = await prisma.tehsil.count();

    if (existingTehsils > 0) {
      console.log('  ℹ️  Tehsils already exist, skipping...');
      return;
    }

    // Get all existing district IDs and state IDs from database
    const districts = await prisma.district.findMany({
      select: { id: true, stateId: true },
    });

    const states = await prisma.state.findMany({
      select: { id: true },
    });

    const validDistrictIds = new Set(districts.map((d) => d.id));
    const validStateIds = new Set(states.map((s) => s.id));

    console.log(
      `  📊 Found ${validDistrictIds.size} valid district IDs and ${validStateIds.size} valid state IDs in database`
    );

    // Filter tehsils to only include those with valid district and state references
    const validTehsils = tehsilsData.filter((tehsil) => {
      if (!validDistrictIds.has(tehsil.districtId)) {
        console.warn(
          `  ⚠️  Skipping tehsil "${tehsil.name}" - invalid districtId: ${tehsil.districtId}`
        );
        return false;
      }
      if (!validStateIds.has(tehsil.stateId)) {
        console.warn(
          `  ⚠️  Skipping tehsil "${tehsil.name}" - invalid stateId: ${tehsil.stateId}`
        );
        return false;
      }
      return true;
    });

    console.log(
      `  ✓ Filtered: ${validTehsils.length} valid tehsils out of ${tehsilsData.length}`
    );

    if (validTehsils.length === 0) {
      console.log('  ⚠️  No valid tehsils found to seed!');
      return;
    }

    // Group tehsils by districtId for batch insertion
    const tehsilsByDistrict: { [key: number]: typeof validTehsils } = {};

    for (const tehsil of validTehsils) {
      if (!tehsilsByDistrict[tehsil.districtId]) {
        tehsilsByDistrict[tehsil.districtId] = [];
      }
      tehsilsByDistrict[tehsil.districtId].push(tehsil);
    }

    let totalCreated = 0;
    let batchCount = 0;

    for (const districtId of Object.keys(tehsilsByDistrict)) {
      try {
        const result = await prisma.tehsil.createMany({
          data: tehsilsByDistrict[parseInt(districtId)],
          skipDuplicates: true,
        });
        totalCreated += result.count;
        batchCount++;
      } catch (batchError: any) {
        console.error(
          `  ❌ Error seeding tehsils for districtId ${districtId}:`,
          batchError.message
        );
        // Continue with next batch instead of failing entirely
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} tehsils from ${batchCount} batches`);
  } catch (error: any) {
    console.error('  ❌ Tehsil seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}
