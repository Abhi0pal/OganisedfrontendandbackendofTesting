import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ScopeType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.users.findMany({
      where: { deleted_at: null },
      include: { role: true, tenant: true },
      orderBy: { id: 'desc' },
    });
  }

  async getRoles() {
    return this.prisma.roles.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getPermissions() {
    // Permissions are stored as 'resources' in your schema
    return this.prisma.resources.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCircleOptions(filters?: {
    districtId?: number;
    blockId?: number;
    tehsilId?: number;
  }) {
    const circles = await this.prisma.department_users.findMany({
      where: {
        ...(filters?.districtId ? { district_id: filters.districtId } : {}),
        ...(filters?.blockId ? { block_id: filters.blockId } : {}),
        ...(filters?.tehsilId ? { tahsil_id: filters.tehsilId } : {}),
        NOT: [{ circle_id: null }, { circle_id: '' }, { circle_id: '0' }],
      },
      distinct: ['circle_id'],
      select: {
        circle_id: true,
      },
      orderBy: {
        circle_id: 'asc',
      },
    });

    return circles.map((row) => ({
      id: row.circle_id,
      name: row.circle_id,
      value: row.circle_id,
    }));
  }

  async getAssignmentScopeOptions(
    scopeType: ScopeType,
    filters?: {
      tenantId?: number;
      projectId?: number;
      stateId?: number;
      districtId?: number;
      blockId?: number;
      tehsilId?: number;
    },
  ) {
    switch (scopeType) {
      case 'STATE': {
        const rows = await this.prisma.state.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, stateCode: true },
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.stateCode ?? null,
        }));
      }

      case 'DISTRICT': {
        const rows = await this.prisma.district.findMany({
          where: {
            isActive: true,
            ...(filters?.stateId ? { stateId: filters.stateId } : {}),
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, districtCode: true },
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.districtCode ?? null,
        }));
      }

      case 'BLOCK': {
        const rows = await this.prisma.block.findMany({
          where: {
            isActive: true,
            ...(filters?.stateId ? { stateId: filters.stateId } : {}),
            ...(filters?.districtId ? { districtId: filters.districtId } : {}),
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, districtCode: true },
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.districtCode ?? null,
        }));
      }

      case 'TEHSIL': {
        const rows = await this.prisma.tehsil.findMany({
          where: {
            isActive: true,
            ...(filters?.stateId ? { stateId: filters.stateId } : {}),
            ...(filters?.districtId ? { districtId: filters.districtId } : {}),
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, subDistrictCode: true },
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.subDistrictCode ?? null,
        }));
      }

      case 'CIRCLE': {
        const rows = await this.prisma.department_users.findMany({
          where: {
            ...(filters?.districtId ? { district_id: filters.districtId } : {}),
            ...(filters?.blockId ? { block_id: filters.blockId } : {}),
            ...(filters?.tehsilId ? { tahsil_id: filters.tehsilId } : {}),
            NOT: [{ circle_id: null }, { circle_id: '' }, { circle_id: '0' }],
          },
          distinct: ['circle_id'],
          select: { circle_id: true },
          orderBy: { circle_id: 'asc' },
        });

        return rows
          .map((row) => {
            const raw = row.circle_id?.trim() ?? '';
            const parsed = Number(raw);
            if (!raw || !Number.isInteger(parsed) || parsed <= 0) return null;
            return {
              id: parsed,
              name: `Circle ${raw}`,
              code: raw,
            };
          })
          .filter((item): item is { id: number; name: string; code: string } => item !== null);
      }

      case 'DIVISION': {
        const rows = await this.prisma.ujsDivision.findMany({
          where: { isActive: true },
          orderBy: { officeName: 'asc' },
          select: { id: true, officeName: true, divisionId: true },
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.officeName,
          code: row.divisionId != null ? String(row.divisionId) : null,
        }));
      }

      case 'VILLAGE': {
        const rows = await this.prisma.village.findMany({
          where: {
            isActive: true,
            ...(filters?.tehsilId ? { tehsilId: filters.tehsilId } : {}),
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, villageCode: true },
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.villageCode ?? null,
        }));
      }

      case 'PROJECT': {
        const rows = await this.prisma.tenantProject.findMany({
          where: {
            is_active: true,
            ...(filters?.tenantId ? { tenant_id: filters.tenantId } : {}),
            ...(filters?.projectId ? { id: filters.projectId } : {}),
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, code: true },
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
        }));
      }

      default:
        return [];
    }
  }

  async createUser(data: {
    email: string;
    userType: string;
    roleId?: number;
    isEmailVerified?: number;
  }) {
    return this.prisma.users.create({
      data: {
        email: data.email,
        user_type: data.userType as any,
        role_id: data.roleId ?? null,
        is_email_verified: data.isEmailVerified ?? 0,
      },
      include: { role: true },
    });
  }

  async updateUser(
    id: number,
    data: {
      email?: string;
      userType?: string;
      roleId?: number;
      isEmailVerified?: number;
    },
  ) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.userType !== undefined && { user_type: data.userType as any }),
        ...(data.roleId !== undefined && { role_id: data.roleId }),
        ...(data.isEmailVerified !== undefined && {
          is_email_verified: data.isEmailVerified,
        }),
      },
      include: { role: true },
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
