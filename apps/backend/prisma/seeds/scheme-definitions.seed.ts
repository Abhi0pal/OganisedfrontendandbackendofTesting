import { PrismaClient } from '@prisma/client';
import { normalizeServiceId } from './utils/service-id.util';
import { schemeDefinitionsData } from './data/scheme-definitions.data';

export async function seedSchemeDefinitions(prisma: PrismaClient) {
  try {

    const payload = schemeDefinitionsData.map((r) => ({
      ...r,
      service_id: normalizeServiceId(r.service_id),
    }));
    const result = await prisma.scheme_definitions.createMany({
      data: payload,
      skipDuplicates: true,
    });


    console.log(`✅ Seeded ${result.count} Scheme Definitions records`);
  } catch (error) {
    console.error('❌ Scheme Definitions seeding failed:', error);
    throw error;
  }
}
