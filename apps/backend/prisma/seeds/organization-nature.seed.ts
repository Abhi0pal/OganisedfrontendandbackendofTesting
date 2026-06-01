import { PrismaClient } from '@prisma/client';
import { organisationNatures } from './data/organization-natures.data';

export async function seedOrganisationNature(prisma: PrismaClient) {
  try {
    const result = await prisma.organisationNature.createMany({
      data: organisationNatures,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Organisation Natures`);
  } catch (error) {
    console.error('❌ Organisation Nature seeding failed:', error);
    throw error;
  }
}
