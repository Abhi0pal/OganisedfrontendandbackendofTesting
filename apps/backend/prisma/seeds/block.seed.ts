import { PrismaClient } from '@prisma/client';
import { blocksData } from './data/blocks.data';

export async function seedBlocks(prisma: PrismaClient) {
  try {
    const existingBlocks = await prisma.block.count();

    if (existingBlocks > 0) {
      console.log('  ℹ️  Blocks already exist, skipping...');
      return;
    }

    // Get all existing district IDs and state IDs from database
    const districts = await prisma.district.findMany({
      select: { id: true, stateId: true },
    });

    const states = await prisma.state.findMany({
      select: { id: true },
    });

    const validDistrictIds = new Set(districts.map(d => d.id));
    const validStateIds = new Set(states.map(s => s.id));

    console.log(`  📊 Found ${validDistrictIds.size} valid district IDs and ${validStateIds.size} valid state IDs in database`);

    // Filter blocks to only include those with valid district and state references
    const validBlocks = blocksData.filter(block => {
      if (!validDistrictIds.has(block.districtId)) {
        console.warn(`  ⚠️  Skipping block "${block.name}" - invalid districtId: ${block.districtId}`);
        return false;
      }
      if (!validStateIds.has(block.stateId)) {
        console.warn(`  ⚠️  Skipping block "${block.name}" - invalid stateId: ${block.stateId}`);
        return false;
      }
      return true;
    });

    console.log(`  ✓ Filtered: ${validBlocks.length} valid blocks out of ${blocksData.length}`);

    if (validBlocks.length === 0) {
      console.log('  ⚠️  No valid blocks found to seed!');
      return;
    }

    // Group blocks by districtId for batch insertion
    const blocksByDistrict: { [key: number]: typeof validBlocks } = {};

    for (const block of validBlocks) {
      if (!blocksByDistrict[block.districtId]) {
        blocksByDistrict[block.districtId] = [];
      }
      blocksByDistrict[block.districtId].push(block);
    }

    let totalCreated = 0;
    let batchCount = 0;

    for (const districtId of Object.keys(blocksByDistrict)) {
      try {
        const result = await prisma.block.createMany({
          data: blocksByDistrict[parseInt(districtId)],
          skipDuplicates: true,
        });
        totalCreated += result.count;
        batchCount++;
      } catch (batchError: any) {
        console.error(`  ❌ Error seeding blocks for districtId ${districtId}:`, batchError.message);
        // Continue with next batch instead of failing entirely
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} blocks from ${batchCount} batches`);
  } catch (error: any) {
    console.error('  ❌ Block seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}
