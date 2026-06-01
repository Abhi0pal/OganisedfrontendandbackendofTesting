
import { PrismaClient } from '@prisma/client';
import { formTypesData } from './data/formtypes.data';

function makeAbbr(name: string) {
  // Take the first letter of each A–Z word; fallback to compact slug
  const letters = name
    .split(/\s+/)
    .map(w => w.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean)
    .map(w => w[0])
    .join('');

  const base = (letters || name.replace(/[^A-Za-z0-9]/g, '')).toUpperCase();
  return base.slice(0, 8) || 'FORM'; // ensure not empty
}

// Keep this name: seedFormTypes
export async function seedFormTypes(prisma: PrismaClient) {
  try {
    console.log('Seeding Form Types...');

    for (const item of formTypesData) {
      const name = item.form_type.trim();
      const abbr = makeAbbr(name); // unique-friendly, non-empty
      const isActive = item.is_active === 'Y';

      await prisma.formType.upsert({
        where: { abbr }, // relies on @unique constraint on abbr
        update: {
          name,
          isActive,
          // You could choose to keep createdAt as-is; usually we don't overwrite timestamps on update
          updatedAt: item.modified ?? undefined,
        },
        create: {
          name,
          abbr,
          isActive,
          createdAt: item.created ?? undefined,
          updatedAt: item.modified ?? undefined,
        },
      });

      console.log(`✔️ Upserted: ${name} (${abbr})`);
    }

    console.log('Form Types seeding completed.');
  } catch (error) {
    console.error('Error seeding Form Types:', error);
  }
}
