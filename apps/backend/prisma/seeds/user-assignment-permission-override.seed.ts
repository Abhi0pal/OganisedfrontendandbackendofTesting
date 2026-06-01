import {
  PermissionEffect,
  PrismaClient,
  UserRoleAssignment,
} from "@prisma/client";

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
      : "NA";

  const safeTransferOrderNo =
    transferOrderNo && transferOrderNo.trim().length > 0
      ? transferOrderNo.trim()
      : "NA";

  return `ASG-${assignmentId}-${safeRolePart}-TO-${safeTransferOrderNo}`;
};

export async function seedUserAssignmentPermissionOverride(prisma: PrismaClient) {
  console.log("Seeding UserAssignmentPermissionOverride table...");

  type AssignmentWithRole = UserRoleAssignment & {
    role?: { name: string | null } | null;
  };

  const assignments = await prisma.userRoleAssignment.findMany({
    take: 2,
    orderBy: { id: "asc" },
    include: { role: { select: { name: true } } },
  }) as AssignmentWithRole[];

  const users = await prisma.users.findMany({
    take: 1,
    orderBy: { id: "asc" },
  });

  if (assignments.length === 0) {
    console.warn(
      "No assignments found in database, skipping UserAssignmentPermissionOverride seeding",
    );
    return;
  }

  const firstAssignment = assignments[0];
  const secondAssignment = assignments[1];

  const ensureAssignmentIdentifier = async (
    assignment: AssignmentWithRole,
  ): Promise<string> => {
    const identifier =
      assignment.assignment_identifier ||
      buildAssignmentIdentifier(
        assignment.id,
        assignment.role_id,
        assignment.transfer_order_no,
        assignment.role?.name,
      );

    if (!assignment.assignment_identifier) {
      await prisma.userRoleAssignment.update({
        where: { id: assignment.id },
        data: { assignment_identifier: identifier },
      });
    }

    return identifier;
  };

  const firstAssignmentIdentifier =
    await ensureAssignmentIdentifier(firstAssignment);

  const secondAssignmentIdentifier = secondAssignment
    ? await ensureAssignmentIdentifier(secondAssignment)
    : null;

  const createdBy = users.length > 0 ? users[0].id : null;

  const overrides = [
    {
      assignment_id: firstAssignmentIdentifier,
      assignment_identifier: firstAssignmentIdentifier,
      permission_id: 5,
      effect: "ALLOW" as PermissionEffect,
      reason: "Temporary additional charge during DM absence",
      created_by: createdBy,
    },
    ...(secondAssignment && secondAssignmentIdentifier
      ? [
          {
            assignment_id: secondAssignmentIdentifier,
            assignment_identifier: secondAssignmentIdentifier,
            permission_id: 13,
            effect: "DENY" as PermissionEffect,
            reason:
              "Investor should not have update access to general applications",
            created_by: createdBy,
          },
        ]
      : []),
  ];

  for (const override of overrides) {
    try {
      await prisma.userAssignmentPermissionOverride.upsert({
        where: {
          assignment_id_permission_id: {
            assignment_id: override.assignment_id,
            permission_id: override.permission_id,
          },
        },
        update: override,
        create: override,
      });
      console.log(
        `Override created: assignment ${override.assignment_id} - permission ${override.permission_id} - ${override.effect}`,
      );
    } catch (error) {
      console.error("Error seeding override:", error);
    }
  }

  console.log("UserAssignmentPermissionOverride seeding completed.\n");
}
