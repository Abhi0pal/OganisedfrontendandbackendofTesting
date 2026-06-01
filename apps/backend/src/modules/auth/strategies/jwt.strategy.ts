import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

const jwtUserSelect = {
  id: true,
  email: true,
  user_type: true,
  role_id: true,
  tenant_id: true,
  project_id: true,
  is_email_verified: true,
  last_login_at: true,
  deleted_at: true,
  role: {
    select: {
      name: true,
    },
  },
  assignments: {
    where: { is_active: true },
    orderBy: { valid_from: 'desc' as const },
    take: 1,
    select: {
      tenant_id: true,
      project_id: true,
    },
  },
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.accessToken || null,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const sessionId = typeof payload?.jti === 'string' ? payload.jti.trim() : '';

    if (sessionId) {
      const activeSession = await this.prisma.user_tokens.findFirst({
        where: {
          token_hash: createHash('sha256').update(sessionId).digest('hex'),
          token_type: 'SSO_EXTERNAL',
          used_at: null,
        },
        select: {
          id: true,
          expires_at: true,
        },
      });

      if (!activeSession || activeSession.expires_at < new Date()) {
        throw new UnauthorizedException('Session expired or revoked');
      }
    }

    // Your token uses `sub` for user id
    const userId = BigInt(payload.sub);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: jwtUserSelect,
    });

    if (!user || user.deleted_at) {
      throw new UnauthorizedException('User not found');
    }

    // 🔍 Attach investorProfileUid to req.user
    const profile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: user.id },
      select: { uid: true },
    });

    // 🏢 Attach deptId to req.user for department/CIS users
    let deptId: number | null = null;
    if (user.user_type === 'DEPARTMENT' || user.user_type === 'CIS_USER') {
      const deptProfile = await this.prisma.department_users.findUnique({
        where: { user_id: user.id },
        select: { dept_id: true }
      });
      deptId = deptProfile?.dept_id ?? null;
    }

    const activeAssignment = Array.isArray(user.assignments) ? user.assignments[0] : null;
    const tenantId = activeAssignment?.tenant_id ?? user.tenant_id ?? null;
    const projectId = activeAssignment?.project_id ?? user.project_id ?? null;

    return {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      roleId: user.role_id,
      roleName: user.role?.name || '',
      tenant_id: tenantId,
      project_id: projectId,
      isEmailVerified: user.is_email_verified,
      lastLoginAt: user.last_login_at,
      investorProfileUid: profile?.uid ?? null, // 👈 crucial
      deptId: deptId, // 👈 Required for department isolation
    };
  }
}
