import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLabourFactorySec85Dto, UpdateLabourFactorySec85Dto } from './dto';

@Injectable()
export class LabourFactorySec85Service {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateLabourFactorySec85Dto) {
    return this.prisma.labourFactorySec85.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.specialProvisionName = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.labourFactorySec85.findMany({
      where,
      orderBy: { specialProvisionName: 'asc' },
    });
  }

  async findOne(id: number) {
    const provision = await this.prisma.labourFactorySec85.findUnique({
      where: { id },
    });

    if (!provision) {
      throw new NotFoundException(`Labour Factory Sec85 with ID ${id} not found`);
    }

    return provision;
  }

  async update(id: number, data: UpdateLabourFactorySec85Dto) {
    try {
      return await this.prisma.labourFactorySec85.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`Labour Factory Sec85 with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.labourFactorySec85.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Labour Factory Sec85 with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const provision = await this.findOne(id);
    return this.prisma.labourFactorySec85.update({
      where: { id },
      data: { isActive: !provision.isActive },
    });
  }
}
