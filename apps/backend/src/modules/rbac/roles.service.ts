
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PrismaClient } from '@prisma/client';

// Version-proof types derived from client methods
type RolesCreateData = Parameters<PrismaClient['roles']['create']>[0] extends { data: infer D } ? D : never;
type RolesUpdateData = Parameters<PrismaClient['roles']['update']>[0] extends { data: infer D } ? D : never;
@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(data: RolesCreateData) {
    return this.prisma.roles.create({ data });
  }

  async findAll(tenantId?: number) {
    return this.prisma.roles.findMany({
      where: tenantId ? { tenant_id: tenantId } : {}
    });
  }

  async findOne(id: number) {
    return this.prisma.roles.findUnique({ where: { id } });
  }

  async update(id: number, data: RolesUpdateData) {
    return this.prisma.roles.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.roles.delete({ where: { id } });
  }
}
