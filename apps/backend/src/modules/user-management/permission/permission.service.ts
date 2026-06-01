import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionAction } from '@prisma/client';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new permission
   */
  async create(data: CreatePermissionDto) {
    try {
      // Validate that module exists
      const module = await this.prisma.module.findUnique({
        where: { id: data.module_id },
      });

      if (!module) {
        throw new BadRequestException(`Module with ID ${data.module_id} not found`);
      }

      // Check for duplicate module_id + action combination
      const existing = await this.prisma.permission.findUnique({
        where: {
          module_id_action: {
            module_id: data.module_id,
            action: data.action,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Permission already exists for module ${data.module_id} with action ${data.action}`,
        );
      }

      const permission = await this.prisma.permission.create({
        data: {
          module_id: data.module_id,
          action: data.action,
          description: data.description,
          is_active: data.is_active ?? true,
        },
        include: {
          module: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      return permission;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create permission: ${message}`);
    }
  }

  /**
   * Get all permissions with optional filters
   */
  async findAll(
    skip: number = 0,
    take: number = 10,
    moduleId?: number,
    action?: PermissionAction,
    isActive?: boolean,
  ) {
    const where: any = {};

    if (moduleId) {
      where.module_id = moduleId;
    }

    if (action) {
      where.action = action;
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take,
        include: {
          module: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          rolePermissions: {
            select: {
              id: true,
              role_id: true,
              effect: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      data: permissions,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get a single permission by ID
   */
  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        module: true,
        rolePermissions: {
          include: {
            role: true,
          },
        },
        overrides: true,
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  /**
   * Get permissions by module
   */
  async findByModule(moduleId: number, skip: number = 0, take: number = 10) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where: { module_id: moduleId },
        skip,
        take,
        include: {
          module: true,
          rolePermissions: true,
        },
        orderBy: { action: 'asc' },
      }),
      this.prisma.permission.count({ where: { module_id: moduleId } }),
    ]);

    return {
      moduleId,
      data: permissions,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Update a permission
   */
  async update(id: number, data: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // If updating module_id or action, check for uniqueness
    if (data.module_id || data.action) {
      const moduleId = data.module_id ?? permission.module_id;
      const action = data.action ?? permission.action;

      // Validate module exists if being updated
      if (data.module_id) {
        const module = await this.prisma.module.findUnique({
          where: { id: data.module_id },
        });
        if (!module) {
          throw new BadRequestException(`Module with ID ${data.module_id} not found`);
        }
      }

      // Check for duplicate if either field is changing
      if (data.module_id !== undefined || data.action !== undefined) {
        const existing = await this.prisma.permission.findUnique({
          where: {
            module_id_action: {
              module_id: moduleId,
              action,
            },
          },
        });

        if (existing && existing.id !== id) {
          throw new ConflictException(
            `Permission already exists for module ${moduleId} with action ${action}`,
          );
        }
      }
    }

    const updated = await this.prisma.permission.update({
      where: { id },
      data: {
        module_id: data.module_id,
        action: data.action,
        description: data.description,
        is_active: data.is_active,
      },
      include: {
        module: true,
        rolePermissions: true,
      },
    });

    return updated;
  }

  /**
   * Delete a permission
   */
  async remove(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: true,
        overrides: true,
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if permission is in use
    if (permission.rolePermissions.length > 0 || permission.overrides.length > 0) {
      throw new ConflictException(
        `Cannot delete permission: it is referenced by ${permission.rolePermissions.length} roles and ${permission.overrides.length} overrides`,
      );
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: `Permission ${id} deleted successfully` };
  }

  /**
   * Bulk update permissions' active status
   */
  async bulkUpdateActive(ids: number[], isActive: boolean) {
    const result = await this.prisma.permission.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        is_active: isActive,
      },
    });

    return {
      message: `Updated ${result.count} permissions`,
      count: result.count,
    };
  }

  /**
   * Get available actions for a module
   */
  async getAvailableActions(moduleId: number) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    const existingPermissions = await this.prisma.permission.findMany({
      where: { module_id: moduleId },
      select: { action: true },
    });

    const usedActions = existingPermissions.map((p) => p.action);
    const allActions = Object.values(PermissionAction);

    return {
      moduleId,
      moduleName: module.name,
      availableActions: allActions.filter((action) => !usedActions.includes(action)),
      usedActions,
    };
  }
}
