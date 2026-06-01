import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkflowAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const tenantId = Number(request.user?.tenant_id) || 1;

    if (!userId) return false;

    // Check if user has the TENANT_ADMIN role for their tenant
    const assignment = await this.prisma.userRoleAssignment.findFirst({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        role: { name: 'TENANT_ADMIN' },
        is_active: true,
      },
      include: {
        role: true,
      }
    });

    return !!assignment;
  }
}
