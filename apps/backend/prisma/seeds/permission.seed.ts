import { PrismaClient, PermissionAction } from '@prisma/client';

export async function seedPermission(prisma: PrismaClient) {
  console.log('🌱 Seeding Permission table...');

  const permissions = [
    // USER_MGMT permissions
    {
      module_id: 2, // USER_MGMT
      action: 'CREATE' as PermissionAction,
      description: 'Can create new users',
      is_active: true,
    },
    {
      module_id: 2,
      action: 'READ' as PermissionAction,
      description: 'Can view user list',
      is_active: true,
    },
    {
      module_id: 2,
      action: 'UPDATE' as PermissionAction,
      description: 'Can edit user details',
      is_active: true,
    },
    {
      module_id: 2,
      action: 'DELETE' as PermissionAction,
      description: 'Can delete users',
      is_active: true,
    },
    // ROLE_MGMT permissions
    {
      module_id: 3, // ROLE_MGMT
      action: 'CREATE' as PermissionAction,
      description: 'Can create new roles',
      is_active: true,
    },
    {
      module_id: 3,
      action: 'READ' as PermissionAction,
      description: 'Can view role list',
      is_active: true,
    },
    {
      module_id: 3,
      action: 'UPDATE' as PermissionAction,
      description: 'Can edit role details',
      is_active: true,
    },
    {
      module_id: 3,
      action: 'DELETE' as PermissionAction,
      description: 'Can delete roles',
      is_active: true,
    },
    // DEPT_MASTER permissions
    {
      module_id: 4, // DEPT_MASTER
      action: 'CREATE' as PermissionAction,
      description: 'Can create new departments',
      is_active: true,
    },
    {
      module_id: 4,
      action: 'READ' as PermissionAction,
      description: 'Can view department list',
      is_active: true,
    },
    {
      module_id: 4,
      action: 'UPDATE' as PermissionAction,
      description: 'Can edit department details',
      is_active: true,
    },
    // APP_PROCESSING permissions
    {
      module_id: 6, // APP_PROCESSING
      action: 'READ' as PermissionAction,
      description: 'Can view applications',
      is_active: true,
    },
    {
      module_id: 6,
      action: 'UPDATE' as PermissionAction,
      description: 'Can update application status',
      is_active: true,
    },
    {
      module_id: 6,
      action: 'APPROVE' as PermissionAction,
      description: 'Can approve applications',
      is_active: true,
    },
    {
      module_id: 6,
      action: 'REJECT' as PermissionAction,
      description: 'Can reject applications',
      is_active: true,
    },
    // WORKFLOW_CONFIG permissions
    {
      module_id: 7, // WORKFLOW_CONFIG
      action: 'READ' as PermissionAction,
      description: 'Can view workflow configuration',
      is_active: true,
    },
    {
      module_id: 7,
      action: 'UPDATE' as PermissionAction,
      description: 'Can configure workflows',
      is_active: true,
    },
    // APP_SUBMISSION permissions
    {
      module_id: 9, // APP_SUBMISSION
      action: 'CREATE' as PermissionAction,
      description: 'Can submit applications',
      is_active: true,
    },
    // MY_APPLICATIONS permissions
    {
      module_id: 10, // MY_APPLICATIONS
      action: 'READ' as PermissionAction,
      description: 'Can view own applications',
      is_active: true,
    },
  ];

  for (const permission of permissions) {
    try {
      await prisma.permission.upsert({
        where: {
          module_id_action: {
            module_id: permission.module_id,
            action: permission.action,
          },
        },
        update: permission,
        create: permission,
      });
      console.log(`  ✓ Permission created: ${permission.action} on module ${permission.module_id}`);
    } catch (error) {
      console.error(`  ✗ Error seeding permission:`, error);
    }
  }

  console.log('✅ Permission seeding completed.\n');
}
