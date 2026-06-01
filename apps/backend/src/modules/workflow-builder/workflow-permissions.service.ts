import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WorkflowPermissionsService {
  private readonly logger = new Logger(WorkflowPermissionsService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * Get all field permissions for a specific workflow process step.
   */
  async getPermissionsByProcess(processId: number) {
    return this.prisma.workflowFieldPermission.findMany({
      where: { workflowProcessId: processId },
      include: {
        role: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Bulk save field permissions for a process step.
   * This handles creating, updating, or deleting permissions.
   */
  async saveBulkPermissions(processId: number, permissions: any[]) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete existing permissions for this process to ensure a clean slate 
      // (or we could do upserts if performance is critical)
      await tx.workflowFieldPermission.deleteMany({
        where: { workflowProcessId: processId },
      });

      // 2. Create new permissions
      if (permissions.length > 0) {
        return tx.workflowFieldPermission.createMany({
          data: permissions.map((p) => ({
            workflowProcessId: processId,
            fieldId: p.fieldId,
            roleId: p.roleId,
            permission: p.permission || 'EDITABLE',
          })),
        });
      }
      return { count: 0 };
    });
  }

  /**
   * Get effective permissions for a specific role at a specific workflow step.
   * This is used at runtime by the officer dashboard.
   */
  async getEffectivePermissions(processId: number, roleId: number) {
    return this.prisma.workflowFieldPermission.findMany({
      where: {
        workflowProcessId: processId,
        roleId: roleId,
      },
      select: {
        fieldId: true,
        permission: true,
      },
    });
  }
}
