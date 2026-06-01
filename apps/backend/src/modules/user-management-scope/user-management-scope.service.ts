import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ScopeType } from '@prisma/client';
import {
  CreateUserManagementScopeDto,
  UpdateUserManagementScopeDto,
} from './dto';

@Injectable()
export class UserManagementScopeService {
  constructor(private readonly prisma: PrismaService) {}

  private getSafeRolePart(roleId?: number | null, roleName?: string | null): string {
    if (roleName && roleName.trim().length > 0) {
      return roleName.trim();
    }

    return roleId != null && Number.isFinite(roleId) ? String(roleId) : 'NA';
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
        : 'NA';

    return `ASG-${assignmentId}-${safeRolePart}-TO-${safeTransferOrderNo}`;
  }

  private async resolveAssignmentIdentifier(assignmentInput: string) {
    const normalizedInput = assignmentInput.trim();
    const parsedId = Number(normalizedInput);
    const isNumericId = Number.isInteger(parsedId) && parsedId > 0;

    const assignment = await this.prisma.userRoleAssignment.findFirst({
      where: isNumericId
        ? {
            OR: [
              { id: parsedId },
              { assignment_identifier: normalizedInput },
            ],
          }
        : { assignment_identifier: normalizedInput },
      select: {
        id: true,
        role_id: true,
        transfer_order_no: true,
        assignment_identifier: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `UserRoleAssignment with assignment identifier ${normalizedInput} not found`,
      );
    }

    if (assignment.assignment_identifier) {
      return assignment.assignment_identifier;
    }

    const generated = this.buildAssignmentIdentifier(
      assignment.id,
      assignment.role_id,
      assignment.transfer_order_no,
      assignment.role?.name,
    );

    await this.prisma.userRoleAssignment.update({
      where: { id: assignment.id },
      data: { assignment_identifier: generated },
    });

    return generated;
  }

  async create(dto: CreateUserManagementScopeDto) {
    const assignmentIdentifier = await this.resolveAssignmentIdentifier(
      dto.assignment_id,
    );

    return this.prisma.userAssignmentScope.create({
      data: {
        assignment_id: assignmentIdentifier,
        assignment_identifier: assignmentIdentifier,
        scope_type: dto.scope_type,
        scope: dto.scope,
        scope_label: dto.scope_label,
        tenant: dto.tenant,
        project: dto.project,
        is_active: dto.is_active,
      } as any,
    });
  }

  async update(id: number, dto: UpdateUserManagementScopeDto) {
    const existing = await this.prisma.userAssignmentScope.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        `UserAssignmentScope with ID ${id} not found`,
      );
    }

    const assignmentId = dto.assignment_id ?? existing.assignment_id;
    const assignmentIdentifier = await this.resolveAssignmentIdentifier(
      assignmentId,
    );

    const data: Record<string, unknown> = {
      updated_on: new Date(),
      assignment_identifier: assignmentIdentifier,
    };

    if (dto.assignment_id !== undefined) data.assignment_id = assignmentIdentifier;
    if (dto.scope_type !== undefined) data.scope_type = dto.scope_type;
    if (dto.scope !== undefined) data.scope = dto.scope;
    if (dto.scope_label !== undefined) data.scope_label = dto.scope_label;
    if (dto.tenant !== undefined) data.tenant = dto.tenant;
    if (dto.project !== undefined) data.project = dto.project;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;

    return this.prisma.userAssignmentScope.update({
      where: { id },
      data: data as any,
    });
  }

  async findAll() {
    return this.prisma.userAssignmentScope.findMany({
      include: {
        assignment: {
          select: {
            id: true,
            assignment_identifier: true,
            role_id: true,
            transfer_order_no: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const scope = await this.prisma.userAssignmentScope.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            id: true,
            assignment_identifier: true,
            role_id: true,
            transfer_order_no: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!scope) {
      throw new NotFoundException(
        `UserAssignmentScope with ID ${id} not found`,
      );
    }

    return scope;
  }

  async remove(id: number) {
    const existing = await this.prisma.userAssignmentScope.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        `UserAssignmentScope with ID ${id} not found`,
      );
    }

    return this.prisma.userAssignmentScope.delete({
      where: { id },
    });
  }
}
