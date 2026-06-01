import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PrismaClient } from '@prisma/client';
import { generateModuleId } from './id-generator.utility';

// Version-proof types derived from client methods
type ModuleCreateData = Parameters<PrismaClient['module']['create']>[0] extends { data: infer D } ? D : never;
type ModuleUpdateData = Parameters<PrismaClient['module']['update']>[0] extends { data: infer D } ? D : never;

@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) { }

  async create(data: ModuleCreateData) {
    // Get the max ID to calculate the next ID
    const maxModule = await this.prisma.module.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const nextId = (maxModule?.id ?? 0) + 1;
    const moduleId = generateModuleId(nextId);

    // Create module with the ID already set
    return this.prisma.module.create({
      data: {
        ...data,
        module_ID: moduleId,
      },
      include: { tenant: true, parent: true, children: true },
    });
  }

  async findAll() {
    return this.prisma.module.findMany({ include: { tenant: true, parent: true, children: true } });
  }

  async findOne(id: number) {
    return this.prisma.module.findUnique({ where: { id }, include: { tenant: true, parent: true, children: true } });
  }

  async update(id: number, data: ModuleUpdateData) {
    return this.prisma.module.update({ where: { id }, data, include: { tenant: true, parent: true, children: true } });
  }

  async remove(id: number) {
    return this.prisma.module.delete({ where: { id } });
  }
}
