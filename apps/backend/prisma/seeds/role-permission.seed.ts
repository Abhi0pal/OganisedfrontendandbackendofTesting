import { PrismaClient, PermissionEffect } from '@prisma/client';

export async function seedRolePermission(prisma: PrismaClient) {
  console.log('🌱 Seeding RolePermission table...');

  const rolePermissions = [
    // Super Admin role - all permissions
    {
      role_id: 1, // Super Admin (assuming ID 1)
      permission_id: 1,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 2,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 3,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 4,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 5,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 6,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 7,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 8,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 9,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 10,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 11,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 12,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 13,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 14,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 15,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 16,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 17,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 18,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 1,
      permission_id: 19,
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    // Department Officer role - limited permissions
    {
      role_id: 2, // Department Officer (assuming ID 2)
      permission_id: 2, // User READ
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 2,
      permission_id: 12, // APP_PROCESSING READ
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 2,
      permission_id: 13, // APP_PROCESSING UPDATE
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 2,
      permission_id: 14, // APP_PROCESSING APPROVE
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 2,
      permission_id: 15, // APP_PROCESSING REJECT
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    // Investor role - limited permissions
    {
      role_id: 3, // Investor (assuming ID 3)
      permission_id: 18, // APP_SUBMISSION CREATE
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
    {
      role_id: 3,
      permission_id: 19, // MY_APPLICATIONS READ
      effect: 'ALLOW' as PermissionEffect,
      created_by: null,
    },
  ];

  for (const rolePermission of rolePermissions) {
    try {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: rolePermission.role_id,
            permission_id: rolePermission.permission_id,
          },
        },
        update: rolePermission,
        create: rolePermission,
      });
      console.log(`  ✓ RolePermission created: role ${rolePermission.role_id} - permission ${rolePermission.permission_id}`);
    } catch (error) {
      console.error(`  ✗ Error seeding role permission:`, error);
    }
  }

  console.log('✅ RolePermission seeding completed.\n');
}
