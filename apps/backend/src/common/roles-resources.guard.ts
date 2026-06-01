import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../modules/database/prisma.service';
import { RESOURCE_CODE_KEY } from './resource.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SKIP_RESOURCE_CHECK_KEY } from './skip-resource-check.decorator';

@Injectable()
export class RolesResourcesGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new UnauthorizedException('User not authenticated');

    const skipResourceCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESOURCE_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipResourceCheck) return true;

    const requiredResourceCode = this.reflector.getAllAndOverride<string>(
      RESOURCE_CODE_KEY,
      [context.getHandler(), context.getClass()],
    );

    let resource: any = null;

    if (requiredResourceCode) {
      resource = await this.prisma.resources.findUnique({
        where: { code: requiredResourceCode },
      });
    } else {
      // Fallback: Dynamic path matching with wildcard support
      const path = req.path;
      const resources = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM resources
        WHERE ${path} LIKE REPLACE(path, '*', '%')
        ORDER BY LENGTH(path) DESC
        LIMIT 1
      `;
      if (resources && resources.length > 0) {
        resource = resources[0];
      }
    }

    if (!resource) {
      throw new ForbiddenException('Resource not found for this path');
    }

    const normalizedUserType = String(user?.userType || '').trim().toUpperCase();
    const resourceCode = String(resource?.code || '').trim().toUpperCase();
    if (normalizedUserType === 'INVESTOR' && resourceCode.startsWith('INVESTOR_')) {
      return true;
    }

    const roleId: number | null = user?.roleId ?? user?.role?.id ?? null;
    if (!roleId) {
      throw new ForbiddenException('User has no role assigned');
    }

    const roleResource = await this.prisma.roleResource.findFirst({
      where: {
        role_id: roleId,
        resource: { code: resource?.code },
      },
      include: { resource: true },
    });

    if (!roleResource) throw new ForbiddenException('Access denied');
    return true;
  }
}
