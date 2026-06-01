import { PrismaClient, ScopeType, UserRoleAssignment } from "@prisma/client";

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

export async function seedUserAssignmentScope(prisma: PrismaClient) {
  console.log("Seeding UserAssignmentScope table...");

  type AssignmentWithRole = UserRoleAssignment & {
    role?: { name: string | null } | null;
  };

  const assignments = await prisma.userRoleAssignment.findMany({
    take: 2,
    orderBy: { id: "asc" },
    include: { role: { select: { name: true } } },
  }) as AssignmentWithRole[];

  if (assignments.length === 0) {
    console.warn("No assignments found in database, skipping UserAssignmentScope seeding");
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

  const scopes = [
    {
      assignment_id: firstAssignmentIdentifier,
      assignment_identifier: firstAssignmentIdentifier,
      scope_type: "STATE" as ScopeType,
      scope: "ALL_STATES",
      scope_label: "All States",
    },
    {
      assignment_id: firstAssignmentIdentifier,
      assignment_identifier: firstAssignmentIdentifier,
      scope_type: "DISTRICT" as ScopeType,
      scope: "DEHRADUN",
      scope_label: "Dehradun",
    },
    {
      assignment_id: firstAssignmentIdentifier,
      assignment_identifier: firstAssignmentIdentifier,
      scope_type: "DISTRICT" as ScopeType,
      scope: "HARIDWAR",
      scope_label: "Haridwar",
    },
    ...(secondAssignment && secondAssignmentIdentifier
      ? [
          {
            assignment_id: secondAssignmentIdentifier,
            assignment_identifier: secondAssignmentIdentifier,
            scope_type: "PROJECT" as ScopeType,
            scope: "MSME_CLEARANCE_2024",
            scope_label: "MSME Clearance 2024",
          },
        ]
      : []),
  ];

  for (const scope of scopes) {
    try {
      await prisma.userAssignmentScope.upsert({
        where: {
          assignment_id_scope_type_scope: {
            assignment_id: scope.assignment_id,
            scope_type: scope.scope_type,
            scope: scope.scope,
          },
        },
        update: scope,
        create: scope,
      });
      console.log(
        `Scope created: assignment ${scope.assignment_id} - ${scope.scope_type} ${scope.scope}`,
      );
    } catch (error) {
      console.error("Error seeding scope:", error);
    }
  }

  console.log("UserAssignmentScope seeding completed.\n");
}
