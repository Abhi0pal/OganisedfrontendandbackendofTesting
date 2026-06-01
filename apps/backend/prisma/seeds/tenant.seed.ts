import { PrismaClient } from '@prisma/client';

// Helper function to generate Tenant ID
function generateTenantId(id: number): string {
  return `TN_${String(id).padStart(3, '0')}`;
}

export async function seedTenant(prisma: PrismaClient) {
  console.log('🌱 Seeding Tenant table...');

  const tenants = [
    {
      name: 'Single Window Clearance System',
      slug: 'swcs',
      domain: null,
      logo_url: null,
      primary_color: '#1a5276',
      plan: 'STANDARD' as const,
      settings: { max_users: 1000, allow_custom_modules: true },
      availableThemes: [
        { id: 'light', name: 'Light', label: '☀️ Light' },
        { id: 'dark', name: 'Dark', label: '🌙 Dark' },
        { id: 'brand', name: 'Brand', label: '🎨 Brand' },
      ],
      is_active: true,
    },
    {
      name: 'Forest Department',
      slug: 'forest',
      domain: null,
      logo_url: null,
      primary_color: '#1e6834',
      plan: 'ENTERPRISE' as const,
      settings: { max_users: 500, allow_custom_modules: true },
      availableThemes: [
        { id: 'light', name: 'Light', label: '☀️ Light' },
        { id: 'dark', name: 'Dark', label: '🌙 Dark' },
        { id: 'brand', name: 'Brand', label: '🎨 Brand' },
        { id: 'forest-green', name: 'Forest Green', label: '🌲 Forest Green' },
      ],
      is_active: true,
    },
    {
      name: 'Urban Development',
      slug: 'urban',
      domain: null,
      logo_url: null,
      primary_color: '#2c5aa0',
      plan: 'STANDARD' as const,
      settings: { max_users: 300, allow_custom_modules: false },
      availableThemes: [
        { id: 'light', name: 'Light', label: '☀️ Light' },
        { id: 'dark', name: 'Dark', label: '🌙 Dark' },
        { id: 'brand', name: 'Brand', label: '🎨 Brand' },
      ],
      is_active: true,
    },
  ];

  // Get max ID to calculate next IDs
  let maxId = 0;
  try {
    const maxTenant = await prisma.tenant.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    maxId = maxTenant?.id ?? 0;
  } catch (error) {
    // Table might be empty
  }

  for (let i = 0; i < tenants.length; i++) {
    const tenant = tenants[i];
    const nextId = maxId + i + 1;
    const tenantId = generateTenantId(nextId);

    try {
      await prisma.tenant.upsert({
        where: { slug: tenant.slug },
        update: { ...tenant, tenant_ID: tenantId },
        create: { ...tenant, tenant_ID: tenantId },
      });
      console.log(`  ✓ Tenant created: ${tenant.name} (ID: ${tenantId})`);
    } catch (error) {
      console.error(`  ✗ Error seeding tenant ${tenant.name}:`, error);
    }
  }

  console.log('✅ Tenant seeding completed.\n');
}
