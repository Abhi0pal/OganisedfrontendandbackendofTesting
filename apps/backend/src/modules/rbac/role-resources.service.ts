
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RoleResourcesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a role-resource assignment using Prisma's generated input type.
   * With model `RoleResource` (mapped to table `role_resources`),
   * the input type is `Prisma.RoleResourceCreateInput` and the delegate is `prisma.roleResource`.
   */
  async create(data: any) {
    return this.prisma.roleResource.create({ data });
  }

  async findAll() {
    return this.prisma.roleResource.findMany({
      include: {
        role: true,
        resource: true,
      },
    });
  }

  async findByRoleId(roleId: number) {
    return this.prisma.roleResource.findMany({
      where: { role_id: roleId }, // field names are as defined in your model
      include: { resource: true },
    });
  }

  async remove(id: bigint) {
    return this.prisma.roleResource.delete({ where: { id } });
  }

  async removeByRoleAndResource(roleId: number, resourceId: bigint) {
    return this.prisma.roleResource.deleteMany({
      where: {
        role_id: roleId,
        resource_id: resourceId,
      },
    });
  }
}
