import { PrismaClient, ModulePortal } from '@prisma/client';

// Helper function to generate Module ID
function generateModuleId(id: number): string {
  return `MOD_${String(id).padStart(3, '0')}`;
}

export async function seedModule(prisma: PrismaClient) {
  console.log('🌱 Seeding Module table...');

  const modules = [
    // Platform-wide modules (tenant_id = null)
    {
      tenant_id: null,
      parent_id: null,
      code: 'ADMIN_PANEL',
      name: 'Admin Panel',
      name_hindi: 'प्रशासन पैनल',
      route: '/admin',
      icon: 'FiSettings',
      portal: 'ADMIN' as ModulePortal,
      order: 1,
      is_leaf: false,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: 1,
      code: 'USER_MGMT',
      name: 'User Management',
      name_hindi: 'उपयोगकर्ता प्रबंधन',
      route: '/admin/users',
      icon: 'FiUsers',
      portal: 'ADMIN' as ModulePortal,
      order: 1,
      is_leaf: true,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: 1,
      code: 'ROLE_MGMT',
      name: 'Role Management',
      name_hindi: 'भूमिका प्रबंधन',
      route: '/admin/roles',
      icon: 'FiLock',
      portal: 'ADMIN' as ModulePortal,
      order: 2,
      is_leaf: true,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: 1,
      code: 'DEPT_MASTER',
      name: 'Department Master',
      name_hindi: 'विभाग मास्टर',
      route: '/admin/departments',
      icon: 'FiBuilding2',
      portal: 'ADMIN' as ModulePortal,
      order: 3,
      is_leaf: true,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: null,
      code: 'DEPT_PORTAL',
      name: 'Department Portal',
      name_hindi: 'विभाग पोर्टल',
      route: '/department',
      icon: 'FiGrid',
      portal: 'DEPARTMENT' as ModulePortal,
      order: 1,
      is_leaf: false,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: 5,
      code: 'APP_PROCESSING',
      name: 'Application Processing',
      name_hindi: 'आवेदन प्रसंस्करण',
      route: '/department/applications',
      icon: 'FiFileText',
      portal: 'DEPARTMENT' as ModulePortal,
      order: 1,
      is_leaf: true,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: 5,
      code: 'WORKFLOW_CONFIG',
      name: 'Workflow Configuration',
      name_hindi: 'वर्कफ़्लो कॉन्फ़िगरेशन',
      route: '/department/workflow',
      icon: 'FiZap',
      portal: 'DEPARTMENT' as ModulePortal,
      order: 2,
      is_leaf: true,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: null,
      code: 'INVESTOR_PORTAL',
      name: 'Investor Portal',
      name_hindi: 'निवेशक पोर्टल',
      route: '/investor',
      icon: 'FiHome',
      portal: 'APPLICANT' as ModulePortal,
      order: 1,
      is_leaf: false,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: 8,
      code: 'APP_SUBMISSION',
      name: 'Application Submission',
      name_hindi: 'आवेदन सबमिशन',
      route: '/investor/submit',
      icon: 'FiPlusCircle',
      portal: 'APPLICANT' as ModulePortal,
      order: 1,
      is_leaf: true,
      is_active: true,
    },
    {
      tenant_id: null,
      parent_id: 8,
      code: 'MY_APPLICATIONS',
      name: 'My Applications',
      name_hindi: 'मेरे आवेदन',
      route: '/investor/applications',
      icon: 'FiList',
      portal: 'APPLICANT' as ModulePortal,
      order: 2,
      is_leaf: true,
      is_active: true,
    },
  ];

  // Get max ID to calculate next IDs
  let maxId = 0;
  try {
    const maxModule = await prisma.module.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    maxId = maxModule?.id ?? 0;
  } catch (error) {
    // Table might be empty
  }

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const nextId = maxId + i + 1;
    const moduleId = generateModuleId(nextId);

    try {
      await prisma.module.upsert({
        where: { code: module.code },
        update: { ...module, module_ID: moduleId },
        create: { ...module, module_ID: moduleId },
      });
      console.log(`  ✓ Module created: ${module.name} (ID: ${moduleId})`);
    } catch (error) {
      console.error(`  ✗ Error seeding module ${module.name}:`, error);
    }
  }

  console.log('✅ Module seeding completed.\n');
}
