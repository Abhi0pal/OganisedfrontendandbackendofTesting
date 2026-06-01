import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLabourFactoryTypeMasterDto, UpdateLabourFactoryTypeMasterDto } from './dto';

@Injectable()
export class LabourFactoryTypeMasterService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateLabourFactoryTypeMasterDto) {
    return this.prisma.labourFactoryTypeMaster.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.factoryType = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.labourFactoryTypeMaster.findMany({
      where,
      orderBy: { factoryType: 'asc' },
    });
  }

  async findOne(id: number) {
    const factoryType = await this.prisma.labourFactoryTypeMaster.findUnique({
      where: { id },
    });

    if (!factoryType) {
      throw new NotFoundException(`Labour Factory Type Master with ID ${id} not found`);
    }

    return factoryType;
  }

  async update(id: number, data: UpdateLabourFactoryTypeMasterDto) {
    try {
      return await this.prisma.labourFactoryTypeMaster.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`Labour Factory Type Master with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.labourFactoryTypeMaster.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Labour Factory Type Master with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const factoryType = await this.findOne(id);
    return this.prisma.labourFactoryTypeMaster.update({
      where: { id },
      data: { isActive: !factoryType.isActive },
    });
  }
}
