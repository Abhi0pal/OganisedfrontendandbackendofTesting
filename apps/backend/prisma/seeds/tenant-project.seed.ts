import { PrismaClient } from '@prisma/client';

// Helper function to generate Project ID
function generateProjectId(id: number): string {
  return `PR_${String(id).padStart(3, '0')}`;
}

export async function seedTenantProject(prisma: PrismaClient) {
  console.log('🌱 Seeding TenantProject table...');

  const projects = [
    {
      tenant_id: 1,
      name: 'MSME Clearance 2024',
      code: 'MSME_2024',
      description: 'MSME clearance process for year 2024',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      is_active: true,
    },
    {
      tenant_id: 1,
      name: 'Forest NOC Phase-2',
      code: 'FOREST_NOC_P2',
      description: 'Forest NOC clearance phase 2',
      start_date: new Date('2024-02-15'),
      end_date: null,
      is_active: true,
    },
    {
      tenant_id: 2,
      name: 'Environmental Impact Assessment',
      code: 'EIA_2024',
      description: 'EIA approval process',
      start_date: new Date('2024-01-01'),
      end_date: null,
      is_active: true,
    },
    {
      tenant_id: 3,
      name: 'Urban Planning Initiative',
      code: 'UPI_2024',
      description: 'Urban planning and development project',
      start_date: new Date('2024-03-01'),
      end_date: new Date('2025-03-01'),
      is_active: true,
    },
  ];

  // Get max ID to calculate next IDs
  let maxId = 0;
  try {
    const maxProject = await prisma.tenantProject.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    maxId = maxProject?.id ?? 0;
  } catch (error) {
    // Table might be empty
  }

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const nextId = maxId + i + 1;
    const projectId = generateProjectId(nextId);

    try {
      await prisma.tenantProject.upsert({
        where: {
          tenant_id_code: {
            tenant_id: project.tenant_id,
            code: project.code,
          },
        },
        update: { ...project, project_ID: projectId },
        create: { ...project, project_ID: projectId },
      });
      console.log(`  ✓ Project created: ${project.name} (ID: ${projectId})`);
    } catch (error) {
      console.error(`  ✗ Error seeding project ${project.name}:`, error);
    }
  }

  console.log('✅ TenantProject seeding completed.\n');
}
