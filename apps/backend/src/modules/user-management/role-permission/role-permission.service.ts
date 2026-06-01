import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';

@Injectable()
export class RolePermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a role-permission mapping
   */
  async create(dto: CreateRolePermissionDto, userId: bigint) {
    return this.prisma.rolePermission.create({
      data: {
        role_id: dto.role_id,
        permission_id: dto.permission_id,
        effect: dto.effect ?? 'ALLOW',
        is_active: dto.is_active ?? true,
        created_by: userId,
      },
    });
  }

  /**
   * Find all role-permission mappings
   */
  async findAll() {
    return this.prisma.rolePermission.findMany({
      include: {
        role: true,
        permission: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Find a single role-permission mapping by ID
   */
  async findOne(id: number) {
    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: { id },
      include: {
        role: true,
        permission: true,
      },
    });

    if (!rolePermission) {
      throw new NotFoundException(`RolePermission with ID ${id} not found`);
    }

    return rolePermission;
  }

  /**
   * Update a role-permission mapping
   * (effect / is_active only)
   */
  async update(id: number, dto: UpdateRolePermissionDto) {
    // Ensure record exists
    await this.findOne(id);

    return this.prisma.rolePermission.update({
      where: { id },
      data: {
        ...(dto.effect !== undefined && { effect: dto.effect }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });
  }

  /**
   * Get role-permissions by role ID
   * (used for RBAC resolution)
   */
  async findByRole(roleId: number) {
    return this.prisma.rolePermission.findMany({
      where: {
        role_id: roleId,
        is_active: true,
      },
      include: {
        permission: true,
      },
      orderBy: {
        permission_id: 'asc',
      },
    });
  }


  /**
   * HARD delete role-permission (use cautiously)
   */
  async remove(id: number) {
    // Ensure record exists
    await this.findOne(id);

    return this.prisma.rolePermission.delete({
      where: { id },
    });
  }
}