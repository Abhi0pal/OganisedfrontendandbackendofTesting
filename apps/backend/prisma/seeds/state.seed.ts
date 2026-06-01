import { PrismaClient } from '@prisma/client';
import { statesData } from './data/states.data';

export async function seedStates(prisma: PrismaClient) {
  try {
    // Get all existing country IDs from database
    const countries = await prisma.country.findMany({
      select: { id: true },
    });

    const validCountryIds = new Set(countries.map(c => c.id));
    console.log(`  📊 Found ${validCountryIds.size} valid country IDs in database`);

    // Filter states to only include those with valid country references
    const validStates = statesData.filter(state => {
      if (!validCountryIds.has(state.countryId)) {
        console.warn(`  ⚠️  Skipping state "${state.name}" - invalid countryId: ${state.countryId}`);
        return false;
      }
      return true;
    });

    console.log(`  ✓ Filtered: ${validStates.length} valid states out of ${statesData.length}`);

    if (validStates.length === 0) {
      console.log('  ⚠️  No valid states found to seed!');
      return;
    }

    // Group states by countryId for batch insertion
    const statesByCountry: { [key: number]: typeof validStates } = {};

    for (const state of validStates) {
      if (!statesByCountry[state.countryId]) {
        statesByCountry[state.countryId] = [];
      }
      statesByCountry[state.countryId].push(state);
    }

    let totalCreated = 0;
    let batchCount = 0;

    for (const countryId of Object.keys(statesByCountry)) {
      try {
        const result = await prisma.state.createMany({
          data: statesByCountry[parseInt(countryId)],
          skipDuplicates: true,
        });
        totalCreated += result.count;
        batchCount++;
      } catch (batchError: any) {
        console.error(`  ❌ Error seeding states for countryId ${countryId}:`, batchError.message);
        // Continue with next batch instead of failing entirely
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} states from ${batchCount} batches`);
  } catch (error: any) {
    console.error('  ❌ State seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}