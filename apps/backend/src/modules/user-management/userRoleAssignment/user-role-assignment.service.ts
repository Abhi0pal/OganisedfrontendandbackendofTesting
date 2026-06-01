import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Prisma } from "@prisma/client";
import {
  CreateUserRoleAssignmentDto,
  UpdateUserRoleAssignmentDto,
} from "./dto";

@Injectable()
export class UserRoleAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  private async syncUserFromLatestOpenAssignment(
    tx: Prisma.TransactionClient,
    userId: bigint,
  ) {
    const latestOpenAssignment = await tx.userRoleAssignment.findFirst({
      where: {
        user_id: userId,
        valid_until: null,
        is_active: true,
      },
      orderBy: [{ valid_from: "desc" }, { updated_at: "desc" }, { id: "desc" }],
      select: {
        role_id: true,
        tenant_id: true,
        project_id: true,
      },
    });

    if (latestOpenAssignment) {
      await tx.users.update({
        where: { id: userId },
        data: {
          role_id: latestOpenAssignment.role_id,
          tenant_id: latestOpenAssignment.tenant_id,
          project_id: latestOpenAssignment.project_id,
        },
      });
      return;
    }

    await tx.users.update({
      where: { id: userId },
      data: {
        role_id: null,
        tenant_id: null,
        project_id: null,
      },
    });
  }

  private getSafeRolePart(roleId?: number | null, roleName?: string | null): string {
    if (roleName && roleName.trim().length > 0) {
      return roleName.trim();
    }

    return roleId != null && Number.isFinite(roleId) ? String(roleId) : "NA";
  }

  private buildAssignmentIdentifier(
    assignmentId: number,
    roleId?: number | null,
    transferOrderNo?: string | null,
    roleName?: string | null,
  ): string {
    const safeRolePart = this.getSafeRolePart(roleId, roleName);
    const safeTransferOrderNo =
      transferOrderNo && transferOrderNo.trim().length > 0
        ? transferOrderNo.trim()
        : "NA";

    return `ASG-${assignmentId}-${safeRolePart}-TO-${safeTransferOrderNo}`;
  }

  private normalizeDate(value?: string | Date | null) {
    if (value === undefined || value === null) return undefined;
    if (value instanceof Date) return value;
    return new Date(value);
  }

  // CREATE
  async create(dto: CreateUserRoleAssignmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.userRoleAssignment.create({
        data: {
          user_id: BigInt(dto.userId),
          role_id: dto.roleId,
          tenant_id: dto.tenantId,
          project_id: dto.projectId,

          valid_from: this.normalizeDate(dto.validFrom),
          valid_until: this.normalizeDate(dto.validUntil),

          transfer_order_no: dto.transferOrderNo,
          transfer_reason: dto.transferReason,
          transferred_from_id: dto.transferredFromId,

          assigned_by: dto.assignedBy ? BigInt(dto.assignedBy) : undefined,

          remarks: dto.remarks,
          is_active: dto.isActive,
        },
      });

      const role = await tx.roles.findUnique({
        where: { id: created.role_id },
        select: { name: true },
      });

      const assignmentIdentifier = this.buildAssignmentIdentifier(
        created.id,
        created.role_id,
        created.transfer_order_no,
        role?.name,
      );

      const createdWithIdentifier = await tx.userRoleAssignment.update({
        where: { id: created.id },
        data: {
          assignment_identifier: assignmentIdentifier,
        },
      });

      await this.syncUserFromLatestOpenAssignment(tx, created.user_id);

      return createdWithIdentifier;
    });
  }

  // UPDATE
  async update(id: number, dto: UpdateUserRoleAssignmentDto) {
    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        `UserRoleAssignment with ID ${id} not found`,
      );
    }

    const previousAssignmentIdentifier =
      existing.assignment_identifier ||
      this.buildAssignmentIdentifier(
        existing.id,
        existing.role_id,
        existing.transfer_order_no,
      );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.userRoleAssignment.update({
        where: { id },
        data: {
          role_id: dto.roleId,
          tenant_id: dto.tenantId,
          project_id: dto.projectId,

          valid_from: this.normalizeDate(dto.validFrom),
          valid_until: this.normalizeDate(dto.validUntil),

          transfer_order_no: dto.transferOrderNo,
          transfer_reason: dto.transferReason,
          transferred_from_id: dto.transferredFromId,

          assigned_by: dto.assignedBy ? BigInt(dto.assignedBy) : undefined,

          remarks: dto.remarks,
          is_active: dto.isActive,
          // updated_at handled automatically by Prisma
        },
      });

      const role = await tx.roles.findUnique({
        where: { id: updated.role_id },
        select: { name: true },
      });

      const assignmentIdentifier = this.buildAssignmentIdentifier(
        updated.id,
        updated.role_id,
        updated.transfer_order_no,
        role?.name,
      );

      const updatedWithIdentifier = await tx.userRoleAssignment.update({
        where: { id },
        data: {
          assignment_identifier: assignmentIdentifier,
        },
      });

      await tx.userAssignmentScope.updateMany({
        where: {
          assignment_id: {
            in: [previousAssignmentIdentifier, String(id)],
          },
        },
        data: {
          assignment_id: assignmentIdentifier,
          assignment_identifier: assignmentIdentifier,
        },
      });

      await tx.userAssignmentPermissionOverride.updateMany({
        where: {
          assignment_id: {
            in: [previousAssignmentIdentifier, String(id)],
          },
        },
        data: {
          assignment_id: assignmentIdentifier,
          assignment_identifier: assignmentIdentifier,
        },
      });

      await this.syncUserFromLatestOpenAssignment(tx, updated.user_id);

      return updatedWithIdentifier;
    });
  }

  // FIND ALL
  async findAll() {
    return this.prisma.userRoleAssignment.findMany({
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // FIND ONE
  async findOne(id: number) {
    const assignment = await this.prisma.userRoleAssignment.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `UserRoleAssignment with ID ${id} not found`,
      );
    }

    return assignment;
  }

  // DELETE
  async remove(id: number) {
    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        `UserRoleAssignment with ID ${id} not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.userRoleAssignment.delete({
        where: { id },
      });

      await this.syncUserFromLatestOpenAssignment(tx, deleted.user_id);

      return deleted;
    });
  }
}
