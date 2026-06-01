
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PrismaClient } from '@prisma/client';

// Version-proof types derived from client methods
type ResourcesCreateData = Parameters<PrismaClient['resources']['create']>[0] extends { data: infer D } ? D : never;
type ResourcesUpdateData = Parameters<PrismaClient['resources']['update']>[0] extends { data: infer D } ? D : never;

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async create(data: ResourcesCreateData) {
    return this.prisma.resources.create({ data });
  }

  async findAll() {
    return this.prisma.resources.findMany();
  }

  async findOne(id: bigint) {
    return this.prisma.resources.findUnique({ where: { id } });
  }

  async update(id: bigint, data: ResourcesUpdateData) {
    return this.prisma.resources.update({ where: { id }, data });
  }

  async remove(id: bigint) {
    return this.prisma.resources.delete({ where: { id } });
  }
}
