import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRoleDto , UpdateRoleDto} from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // ---------------- CREATE ----------------
  async create(dto: CreateRoleDto) {
    try {
      
      const project = await this.prisma.tenantProject.findUnique({
        where: { id: dto.project_id },
      });

      if (!project) {
        throw new BadRequestException('Invalid project');
      }

      
      if (dto.tenant_id !== undefined) {
        if (dto.tenant_id === null) {
          throw new BadRequestException(
            'Project cannot exist without tenant',
          );
        }

        if (project.tenant_id !== dto.tenant_id) {
          throw new BadRequestException(
            'Project does not belong to tenant',
          );
        }
      }

      
      if (dto.parent_id !== undefined && dto.parent_id !== null) {
        const parent = await this.prisma.roles.findUnique({
          where: { id: dto.parent_id },
        });

        if (!parent) {
          throw new BadRequestException('Invalid parent role');
        }

        if (parent.project_id !== dto.project_id) {
          throw new BadRequestException(
            'Parent role must belong to same project',
          );
        }
      }

      return await this.prisma.roles.create({
  data: {
    name: dto.name,
    description: dto.description,
    level: dto.level ?? 0,
    is_active: dto.is_active ?? true,
    is_system: false,

    ...(dto.tenant_id !== undefined && {
      tenant: {
        connect: { id: dto.tenant_id },
      },
    }),

    ...(dto.project_id !== undefined && {
      project: {
        connect: { id: dto.project_id },
      },
    }),

    ...(dto.parent_id !== undefined && dto.parent_id !== null && {
      parent: {
        connect: { id: dto.parent_id },
      },
    }),
  },
});
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ---------------- GET ALL ----------------
  async findAll() {
    try {
      return await this.prisma.roles.findMany({
        orderBy: { id: 'desc' },
        include: {
          project: true,
          parent: true,
          children: true,
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch roles');
    }
  }

  // ---------------- GET ONE ----------------
  async findOne(id: number) {
    try {
      const role = await this.prisma.roles.findUnique({
        where: { id },
        include: {
          project: true,
          parent: true,
          children: true,
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      return role;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch role');
    }
  }

  // ---------------- UPDATE ----------------
  async update(id: number, dto: UpdateRoleDto) {
    try {
      const existing = await this.prisma.roles.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Role not found');
      }

      if (existing.is_system) {
        throw new ForbiddenException(
          'System roles cannot be modified',
        );
      }

      const projectId =
        dto.project_id !== undefined
          ? dto.project_id
          : existing.project_id;

     
      if (dto.project_id !== undefined) {
        const project = await this.prisma.tenantProject.findUnique({
          where: { id: dto.project_id },
        });

        if (!project) {
          throw new BadRequestException('Invalid project');
        }

        
        if (dto.tenant_id !== undefined) {
          if (dto.tenant_id === null) {
            throw new BadRequestException(
              'Project cannot exist without tenant',
            );
          }

          if (project.tenant_id !== dto.tenant_id) {
            throw new BadRequestException(
              'Project does not belong to tenant',
            );
          }
        }
      }

      
      if (dto.parent_id !== undefined) {
        if (dto.parent_id === null) {
          // allowed → removing parent
        } else {
          if (dto.parent_id === id) {
            throw new BadRequestException(
              'Role cannot be its own parent',
            );
          }

          const parent = await this.prisma.roles.findUnique({
            where: { id: dto.parent_id },
          });

          if (!parent) {
            throw new BadRequestException('Invalid parent role');
          }

          if (parent.project_id !== projectId) {
            throw new BadRequestException(
              'Parent role must belong to same project',
            );
          }
        }
      }

     const updateData: Prisma.rolesUpdateInput = {
  name: dto.name,
  description: dto.description,
  level: dto.level,
  is_active: dto.is_active,
};

if (dto.tenant_id !== undefined) {
  updateData.tenant = dto.tenant_id
    ? { connect: { id: dto.tenant_id } }
    : { disconnect: true };
}

if (dto.project_id !== undefined) {
  updateData.project = dto.project_id
    ? { connect: { id: dto.project_id } }
    : { disconnect: true };
}

if (dto.parent_id !== undefined) {
  updateData.parent = dto.parent_id
    ? { connect: { id: dto.parent_id } }
    : { disconnect: true };
}

return this.prisma.roles.update({
  where: { id },
  data: updateData,
});
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ---------------- DELETE ----------------
  async remove(id: number) {
    try {
      const role = await this.prisma.roles.findUnique({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      if (role.is_system) {
        throw new ForbiddenException(
          'System roles cannot be deleted',
        );
      }

      return await this.prisma.roles.delete({
        where: { id },
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ---------------- ERROR HANDLER ----------------
  private handleError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Role with same name already exists in this project',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Record not found');
      }

      throw new BadRequestException(error.message);
    }

    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof BadRequestException ||
      error instanceof ForbiddenException
    ) {
      throw error;
    }

    throw new InternalServerErrorException('Something went wrong');
  }
}