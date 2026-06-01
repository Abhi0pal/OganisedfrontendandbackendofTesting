import { PrismaClient } from '@prisma/client';

export async function seedDynamicMasterDefinitions(prisma: PrismaClient) {
  try {
    console.log('Seeding real master data from database...');

    // Insert Country master
    await prisma.$executeRaw`
      INSERT INTO public.master_definition (tenant_id, name, code, description, icon, is_active, is_system, allow_import, display_order, created_by, created_at, updated_at)
      VALUES (1, 'Country', 'COUNTRY', 'List of countries', 'globe', true, false, true, 1, 1, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;

    const countries = await prisma.$queryRaw<any[]>`SELECT id FROM public.master_definition WHERE code='COUNTRY' AND tenant_id=1 LIMIT 1`;
    if (countries.length > 0) {
      const countryId = countries[0].id;
      await prisma.$executeRaw`
        INSERT INTO public.master_data (master_id, tenant_id, data, is_active, created_by, created_at, updated_at)
        VALUES (${countryId}, 1, '{"name":"India","code":"IN"}', true, 1, NOW(), NOW()),
               (${countryId}, 1, '{"name":"USA","code":"US"}', true, 1, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;
      console.log('✓ Country master with 2 records');
    }

    // Insert State master
    await prisma.$executeRaw`
      INSERT INTO public.master_definition (tenant_id, name, code, description, icon, is_active, is_system, allow_import, display_order, created_by, created_at, updated_at)
      VALUES (1, 'State', 'STATE', 'List of states', 'map', true, false, true, 2, 1, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;

    const states = await prisma.$queryRaw<any[]>`SELECT id FROM public.master_definition WHERE code='STATE' AND tenant_id=1 LIMIT 1`;
    if (states.length > 0) {
      const stateId = states[0].id;
      await prisma.$executeRaw`
        INSERT INTO public.master_data (master_id, tenant_id, data, is_active, created_by, created_at, updated_at)
        VALUES (${stateId}, 1, '{"name":"UP","code":"UP"}', true, 1, NOW(), NOW()),
               (${stateId}, 1, '{"name":"Bihar","code":"BR"}', true, 1, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;
      console.log('✓ State master with 2 records');
    }

    console.log('Seeding done!');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
