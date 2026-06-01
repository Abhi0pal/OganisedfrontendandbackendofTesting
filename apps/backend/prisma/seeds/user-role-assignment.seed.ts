import { PrismaClient } from '@prisma/client';

const buildAssignmentIdentifier = (
  assignmentId: number,
  roleId?: number | null,
  transferOrderNo?: string | null,
  roleName?: string | null,
) => {
  const safeRolePart =
    roleName && roleName.trim().length > 0
      ? roleName.trim()
      : roleId != null && Number.isFinite(roleId)
      ? String(roleId)
      : 'NA';

  const safeTransferOrderNo =
    transferOrderNo && transferOrderNo.trim().length > 0
      ? transferOrderNo.trim()
      : 'NA';

  return `ASG-${assignmentId}-${safeRolePart}-TO-${safeTransferOrderNo}`;
};

export async function seedUserRoleAssignment(prisma: PrismaClient) {
  console.log('🌱 Seeding UserRoleAssignment table...');

  // First, fetch existing users to use real IDs
  const users = await prisma.users.findMany({
    take: 3,
    orderBy: { id: 'asc' },
  });

  if (users.length === 0) {
    console.warn('  ⚠️  No users found in database, skipping UserRoleAssignment seeding');
    return;
  }

  const assignments = [
    {
      user_id: users[0].id,
      role_id: 1, // Super Admin
      tenant_id: 1, // SWCS tenant
      project_id: null,
      valid_from: new Date('2024-01-01'),
      valid_until: null,
      transfer_order_no: null,
      transfer_reason: null,
      transferred_from_id: null,
      assigned_by: null,
      remarks: 'Super admin assignment',
      is_active: true,
    },
    ...(users.length > 1 ? [{
      user_id: users[1].id,
      role_id: 2, // Department Officer
      tenant_id: 1,
      project_id: 1, // MSME_2024 project
      valid_from: new Date('2024-01-01'),
      valid_until: null,
      transfer_order_no: null,
      transfer_reason: null,
      transferred_from_id: null,
      assigned_by: users[0].id,
      remarks: 'Department officer for MSME clearance',
      is_active: true,
    }] : []),
    ...(users.length > 2 ? [{
      user_id: users[2].id,
      role_id: 3, // Investor
      tenant_id: 1,
      project_id: null,
      valid_from: new Date('2024-01-01'),
      valid_until: null,
      transfer_order_no: null,
      transfer_reason: null,
      transferred_from_id: null,
      assigned_by: null,
      remarks: 'Investor user assignment',
      is_active: true,
    }] : []),
  ];

  for (const assignment of assignments) {
    try {
      const created = await prisma.userRoleAssignment.create({
        data: assignment,
        include: {
          role: {
            select: {
              name: true,
            },
          },
        },
      });

      const assignmentIdentifier = buildAssignmentIdentifier(
        created.id,
        created.role_id,
        created.transfer_order_no,
        created.role?.name,
      );

      await prisma.userRoleAssignment.update({
        where: { id: created.id },
        data: { assignment_identifier: assignmentIdentifier },
      });

      console.log(`  ✓ Assignment created: user ${assignment.user_id} - role ${assignment.role_id} - tenant ${assignment.tenant_id}`);
    } catch (error) {
      console.error(`  ✗ Error seeding assignment:`, error);
    }
  }

  console.log('✅ UserRoleAssignment seeding completed.\n');
}
