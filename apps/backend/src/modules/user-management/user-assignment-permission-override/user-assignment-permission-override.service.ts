import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../../../common/prisma.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserAssignmentPermissionOverrideDto } from './dto/create-user-assignment-permission-override.dto';
import { UpdateUserAssignmentPermissionOverrideDto } from './dto/update-user-assignment-permission-override.dto';


@Injectable()
export class UserAssignmentPermissionOverrideService {
    constructor(private readonly prisma: PrismaService) { }

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

    private async validateAndResolveLatestOpenAssignment(assignmentInput: string) {
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
          user_id: true,
          role_id: true,
          valid_until: true,
          valid_from: true,
          updated_at: true,
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

      if (assignment.valid_until !== null) {
        throw new BadRequestException(
          'Permission override can only be assigned to an open assignment (valid_until must be null)',
        );
      }

      const latestOpenAssignment = await this.prisma.userRoleAssignment.findFirst({
        where: {
          user_id: assignment.user_id,
          valid_until: null,
        },
        orderBy: [
          { valid_from: 'desc' },
          { updated_at: 'desc' },
          { id: 'desc' },
        ],
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

      if (!latestOpenAssignment) {
        throw new BadRequestException(
          'No latest open assignment found for this user',
        );
      }

      const assignmentIdentifier =
        latestOpenAssignment.assignment_identifier ||
        this.buildAssignmentIdentifier(
          latestOpenAssignment.id,
          latestOpenAssignment.role_id,
          latestOpenAssignment.transfer_order_no,
          latestOpenAssignment.role?.name,
        );

      if (latestOpenAssignment.id !== assignment.id) {
        throw new BadRequestException(
          `Only latest open assignment is allowed for overrides. Expected assignment identifier ${assignmentIdentifier}.`,
        );
      }

      if (!latestOpenAssignment.assignment_identifier) {
        await this.prisma.userRoleAssignment.update({
          where: { id: latestOpenAssignment.id },
          data: { assignment_identifier: assignmentIdentifier },
        });
      }

      return {
        assignmentIdentifier,
      };
    }

    async create(dto: CreateUserAssignmentPermissionOverrideDto, userId: bigint) {
        const { assignmentIdentifier } =
          await this.validateAndResolveLatestOpenAssignment(dto.assignment_id);

        return this.prisma.userAssignmentPermissionOverride.create({
            data: {
                assignment_id: assignmentIdentifier,
                assignment_identifier: assignmentIdentifier,
                permission_id: dto.permission_id,
                effect: dto.effect,
                reason: dto.reason,
                created_by: userId,
            },
        });
    }

    async update(id: number, dto: UpdateUserAssignmentPermissionOverrideDto) {
        const existing =
            await this.prisma.userAssignmentPermissionOverride.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException(`Override with ID ${id} not found`);
        }

        const { assignmentIdentifier } =
          await this.validateAndResolveLatestOpenAssignment(existing.assignment_id);

        return this.prisma.userAssignmentPermissionOverride.update({
            where: { id },
            data: {
              ...dto,
              assignment_identifier: assignmentIdentifier,
            },
        });
    }

    async findAll() {
  return this.prisma.userAssignmentPermissionOverride.findMany({
    include: {
      permission: {
        select: {
          id: true,
          action: true,
          module_id: true,
          description: true,
        },
      },
      assignment: {
        select: {
          id: true,
          user_id: true,
          role_id: true,
          valid_from: true,
          valid_until: true,
          transfer_order_no: true,
          assignment_identifier: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { id: "asc" },
  });
}

    async findOne(id: number) {
        const record =
            await this.prisma.userAssignmentPermissionOverride.findUnique({
              where: { id },
              include: {
                permission: true,
                assignment: {
                  select: {
                    id: true,
                    user_id: true,
                    role_id: true,
                    valid_from: true,
                    valid_until: true,
                    transfer_order_no: true,
                    assignment_identifier: true,
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

        if (!record) {
            throw new NotFoundException(`Override with ID ${id} not found`);
        }

        return record;
    }

    async remove(id: number) {
      const existing =
        await this.prisma.userAssignmentPermissionOverride.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Override with ID ${id} not found`);
      }

      return this.prisma.userAssignmentPermissionOverride.delete({
        where: { id },
      });
    }
}
