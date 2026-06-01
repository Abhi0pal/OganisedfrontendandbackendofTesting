import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUnitTypesDto, UpdateUnitTypesDto } from './dto';

@Injectable()
export class UnitTypesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUnitTypesDto) {
    return this.prisma.unitTypes.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.unitTypes.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const unitType = await this.prisma.unitTypes.findUnique({ where: { id } });
    if (!unitType) throw new NotFoundException('UnitType not found');
    return unitType;
  }

  async update(id: number, data: UpdateUnitTypesDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.unitTypes.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    await this.findOne(id); // Ensure exists
    return this.prisma.unitTypes.delete({ where: { id } });
  }

  async toggle(id: number) {
    const unitType = await this.findOne(id);
    return this.prisma.unitTypes.update({
      where: { id },
      data: { isActive: !unitType.isActive },
    });
  }
}
